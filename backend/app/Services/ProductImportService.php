<?php

namespace App\Services;

use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class ProductImportService
{
    private const MAX_ERRORS = 50;

    /**
     * @param  array{
     *   images_dir?: string|null,
     *   default_stock?: int,
     *   default_price?: float|int|string|null,
     *   delimiter?: string,
     *   create_missing?: bool,
     *   dry_run?: bool,
     * }  $options
     * @return array{created:int,updated:int,skipped:int,images_attached:int,errors:array<int,string>}
     */
    public function importCsv(string $csvPath, array $options = []): array
    {
        $delimiter = (string) ($options['delimiter'] ?? ',');
        $createMissing = (bool) ($options['create_missing'] ?? false);
        $dryRun = (bool) ($options['dry_run'] ?? false);
        $defaultStock = (int) ($options['default_stock'] ?? 10);
        $defaultPrice = $options['default_price'] ?? null;
        $imagesDir = Arr::get($options, 'images_dir');

        $result = [
            'created' => 0,
            'updated' => 0,
            'skipped' => 0,
            'images_attached' => 0,
            'errors' => [],
        ];

        $csvReal = realpath($csvPath) ?: $csvPath;
        if (! is_file($csvReal)) {
            $result['errors'][] = "CSV no encontrado: {$csvReal}";
            return $result;
        }

        if (! Schema::hasTable('products') || ! Schema::hasTable('categories') || ! Schema::hasTable('brands')) {
            $result['errors'][] = 'Tablas no encontradas. Ejecuta primero: php artisan migrate:fresh --seed';
            return $result;
        }

        $imageIndex = $this->buildImagesIndex($imagesDir);

        $file = new \SplFileObject($csvReal);
        $file->setFlags(\SplFileObject::READ_CSV | \SplFileObject::SKIP_EMPTY | \SplFileObject::DROP_NEW_LINE);
        $file->setCsvControl($delimiter);

        $header = null;
        $rowNumber = 0;

        foreach ($file as $row) {
            $rowNumber++;
            if (! is_array($row) || (count($row) === 1 && ($row[0] === null || trim((string) $row[0]) === ''))) {
                continue;
            }

            if ($header === null) {
                $header = $this->normalizeHeaderRow($row);
                continue;
            }

            try {
                $data = $this->rowToAssoc($header, $row);
                $normalized = $this->normalizeRow($data);

                if (! $normalized) {
                    $result['skipped']++;
                    continue;
                }

                $codigo = $normalized['codigo'];
                $name = $normalized['name'];
                $price = $normalized['price'] ?? $this->normalizePrice((string) $defaultPrice);
                if ($price === null) {
                    throw new \RuntimeException('price inválido');
                }

                $category = $this->resolveCategory($normalized, $createMissing);
                $brand = $this->resolveBrand($normalized, $createMissing);

                if (! $category || ! $brand) {
                    $missing = [];
                    if (! $category) {
                        $missing[] = 'category';
                    }
                    if (! $brand) {
                        $missing[] = 'brand';
                    }
                    throw new \RuntimeException('Faltan relaciones: '.implode(', ', $missing));
                }

                $payload = [
                    'codigo' => $codigo,
                    'name' => $name,
                    'description' => $normalized['description'] ?? null,
                    'category_id' => $category->id,
                    'brand_id' => $brand->id,
                    'price' => $price,
                    'stock_quantity' => $normalized['stock_quantity'] ?? $defaultStock,
                    'status' => $normalized['status'] ?? 'active',
                ];

                $imageFiles = $this->resolveImageFiles($normalized, $imageIndex);

                if ($dryRun) {
                    $existing = Product::query()->where('codigo', $codigo)->exists();
                    $existing ? $result['updated']++ : $result['created']++;
                    $result['images_attached'] += count($imageFiles);
                    continue;
                }

                DB::transaction(function () use ($payload, $imageFiles, &$result) {
                    /** @var Product $product */
                    $product = Product::query()->where('codigo', $payload['codigo'])->first();
                    $isNew = ! $product;

                    if ($isNew) {
                        $product = Product::query()->create($payload);
                        $result['created']++;
                    } else {
                        $product->fill($payload)->save();
                        $result['updated']++;
                    }

                    if (count($imageFiles) > 0) {
                        $images = app(ProductImageService::class);
                        $order = (int) ($product->images()->max('order') ?? -1) + 1;
                        foreach ($imageFiles as $path) {
                            $uploaded = $this->asUploadedFile($path);
                            $image = $images->addImage($product, $uploaded);
                            $image->forceFill(['order' => $order])->save();
                            $order++;
                            $result['images_attached']++;
                        }
                    }
                });
            } catch (\Throwable $e) {
                $result['errors'][] = "L{$rowNumber}: ".$e->getMessage();
                if (count($result['errors']) >= self::MAX_ERRORS) {
                    $result['errors'][] = 'Demasiados errores; se detuvo el import para evitar spam.';
                    break;
                }
            }
        }

        return $result;
    }

    /**
     * @return array<string, int>
     */
    private function normalizeHeaderRow(array $row): array
    {
        $headers = [];
        foreach ($row as $index => $name) {
            $key = Str::of((string) $name)->trim()->lower()->toString();
            $key = str_replace([' ', '-'], ['_', '_'], $key);
            $headers[$key] = (int) $index;
        }

        return $headers;
    }

    /**
     * @param  array<string, int>  $header
     * @return array<string, string|null>
     */
    private function rowToAssoc(array $header, array $row): array
    {
        $assoc = [];
        foreach ($header as $key => $index) {
            $assoc[$key] = array_key_exists($index, $row) ? ($row[$index] !== null ? (string) $row[$index] : null) : null;
        }

        return $assoc;
    }

    /**
     * @param  array<string, string|null>  $row
     * @return array{
     *   codigo:string,
     *   name:string,
     *   description:?string,
     *   price:string,
     *   stock_quantity?:int,
     *   status?:string,
     *   category_id?:int,
     *   category_slug?:string,
     *   category_name?:string,
     *   brand_id?:int,
     *   brand_slug?:string,
     *   brand_name?:string,
     *   images?:string
     * }|null
     */
    private function normalizeRow(array $row): ?array
    {
        $codigo = trim((string) ($row['codigo'] ?? ''));
        $name = trim((string) ($row['name'] ?? $row['nombre'] ?? ''));

        if ($codigo === '' || $name === '') {
            return null;
        }

        $rawPrice = (string) ($row['price'] ?? $row['precio'] ?? '');
        $price = $this->normalizePrice($rawPrice);

        $description = $row['description'] ?? $row['descripcion'] ?? null;
        $description = is_string($description) ? trim($description) : null;
        if ($description === '') {
            $description = null;
        }

        $status = trim((string) ($row['status'] ?? ''));
        if ($status === '') {
            $status = null;
        }
        if ($status !== null && ! in_array($status, ['active', 'inactive'], true)) {
            throw new \RuntimeException('status debe ser active/inactive');
        }

        $stock = trim((string) ($row['stock_quantity'] ?? $row['stock'] ?? ''));
        $stockInt = null;
        if ($stock !== '') {
            if (! is_numeric($stock)) {
                throw new \RuntimeException('stock_quantity inválido');
            }
            $stockInt = max(0, (int) $stock);
        }

        $categoryId = $this->normalizeInt($row['category_id'] ?? null);
        $brandId = $this->normalizeInt($row['brand_id'] ?? null);

        $categorySlug = trim((string) ($row['category_slug'] ?? $row['categoria_slug'] ?? ''));
        $brandSlug = trim((string) ($row['brand_slug'] ?? $row['marca_slug'] ?? ''));

        $categoryName = trim((string) ($row['category'] ?? $row['categoria'] ?? ''));
        $brandName = trim((string) ($row['brand'] ?? $row['marca'] ?? ''));

        $images = trim((string) ($row['images'] ?? $row['image'] ?? $row['imagen'] ?? ''));
        if ($images === '') {
            $images = null;
        }

        return array_filter([
            'codigo' => $codigo,
            'name' => $name,
            'description' => $description,
            'price' => $price,
            'stock_quantity' => $stockInt,
            'status' => $status,
            'category_id' => $categoryId,
            'category_slug' => $categorySlug !== '' ? $categorySlug : null,
            'category_name' => $categoryName !== '' ? $categoryName : null,
            'brand_id' => $brandId,
            'brand_slug' => $brandSlug !== '' ? $brandSlug : null,
            'brand_name' => $brandName !== '' ? $brandName : null,
            'images' => $images,
        ], static fn ($v) => $v !== null) ?: null;
    }

    private function normalizePrice(string $value): ?string
    {
        $v = trim($value);
        if ($v === '') {
            return null;
        }

        $v = str_replace(['S/', 's/', 'S\\', '$'], '', $v);
        $v = trim($v);

        // 84,80 -> 84.80 (si no hay punto)
        if (str_contains($v, ',') && ! str_contains($v, '.')) {
            $v = str_replace(',', '.', $v);
        }

        // remove thousand separators 1,234.50 or 1.234,50 (basic)
        $v = preg_replace('/\s+/', '', $v) ?? $v;
        if (! is_numeric($v)) {
            return null;
        }

        return number_format((float) $v, 2, '.', '');
    }

    private function normalizeInt(?string $value): ?int
    {
        if ($value === null) {
            return null;
        }
        $v = trim($value);
        if ($v === '') {
            return null;
        }
        if (! is_numeric($v)) {
            return null;
        }

        return (int) $v;
    }

    private function resolveCategory(array $row, bool $createMissing): ?Category
    {
        if (isset($row['category_id'])) {
            return Category::query()->find((int) $row['category_id']);
        }

        $slug = $row['category_slug'] ?? null;
        $name = $row['category_name'] ?? null;

        if (is_string($slug) && $slug !== '') {
            $category = Category::query()->where('slug', $slug)->first();
            if ($category) return $category;
            if ($createMissing) {
                return $this->createCategoryFromName($slug);
            }
        }

        if (is_string($name) && $name !== '') {
            $category = Category::query()->where('name', $name)->first();
            if ($category) return $category;
            $slugFromName = Str::slug($name);
            $category = Category::query()->where('slug', $slugFromName)->first();
            if ($category) return $category;
            if ($createMissing) {
                return $this->createCategoryFromName($name);
            }
        }

        return null;
    }

    private function createCategoryFromName(string $nameOrSlug): Category
    {
        $name = trim($nameOrSlug);
        $slug = Str::slug($nameOrSlug);
        if ($slug === '') {
            $slug = 'category';
        }

        $base = $slug;
        $i = 1;
        while (Category::query()->where('slug', $slug)->exists()) {
            $i++;
            $slug = "{$base}-{$i}";
        }

        return Category::query()->create([
            'name' => $name,
            'slug' => $slug,
            'parent_id' => null,
        ]);
    }

    private function resolveBrand(array $row, bool $createMissing): ?Brand
    {
        if (isset($row['brand_id'])) {
            return Brand::query()->find((int) $row['brand_id']);
        }

        $slug = $row['brand_slug'] ?? null;
        $name = $row['brand_name'] ?? null;

        if (is_string($slug) && $slug !== '') {
            $brand = Brand::query()->where('slug', $slug)->first();
            if ($brand) return $brand;
            if ($createMissing) {
                return $this->createBrandFromName($slug);
            }
        }

        if (is_string($name) && $name !== '') {
            $brand = Brand::query()->where('name', $name)->first();
            if ($brand) return $brand;
            $slugFromName = Str::slug($name);
            $brand = Brand::query()->where('slug', $slugFromName)->first();
            if ($brand) return $brand;
            if ($createMissing) {
                return $this->createBrandFromName($name);
            }
        }

        return null;
    }

    private function createBrandFromName(string $nameOrSlug): Brand
    {
        $name = trim($nameOrSlug);
        $slug = Str::slug($nameOrSlug);
        if ($slug === '') {
            $slug = 'brand';
        }

        $base = $slug;
        $i = 1;
        while (Brand::query()->where('slug', $slug)->exists()) {
            $i++;
            $slug = "{$base}-{$i}";
        }

        return Brand::query()->create([
            'name' => $name,
            'slug' => $slug,
            'logo_path' => null,
        ]);
    }

    /**
     * @param  array<string, string>  $imageIndex
     * @return array<int, string>
     */
    private function resolveImageFiles(array $row, array $imageIndex): array
    {
        $images = $row['images'] ?? null;
        $candidates = [];
        if (is_string($images) && $images !== '') {
            $parts = array_values(array_filter(array_map('trim', explode('|', $images))));
            foreach ($parts as $p) {
                $candidates[] = $p;
            }
        }

        $resolved = [];
        foreach ($candidates as $candidate) {
            $path = $this->findImagePath($candidate, $imageIndex);
            if ($path) {
                $resolved[] = $path;
            }
        }

        if (count($resolved) > 0) {
            return array_values(array_unique($resolved));
        }

        // fallback: try codigo or name
        foreach (['codigo', 'name'] as $k) {
            if (! isset($row[$k])) continue;
            $path = $this->findImagePath((string) $row[$k], $imageIndex);
            if ($path) return [$path];
        }

        return [];
    }

    /**
     * @param  array<string, string>  $imageIndex
     */
    private function findImagePath(string $key, array $imageIndex): ?string
    {
        if ($key === '') return null;

        $normalized = $this->normalizeImageKey($key);
        if (isset($imageIndex[$normalized])) {
            return $imageIndex[$normalized];
        }

        $basename = pathinfo($key, PATHINFO_FILENAME);
        $normalizedBase = $this->normalizeImageKey($basename);
        if (isset($imageIndex[$normalizedBase])) {
            return $imageIndex[$normalizedBase];
        }

        return null;
    }

    /**
     * @return array<string, string> map(normalized-basename => fullpath)
     */
    private function buildImagesIndex(?string $imagesDir): array
    {
        if (! $imagesDir) return [];
        $dir = realpath($imagesDir) ?: $imagesDir;
        if (! is_dir($dir)) return [];

        $index = [];
        $files = File::files($dir);
        foreach ($files as $file) {
            $ext = strtolower($file->getExtension());
            if (! in_array($ext, ['jpg', 'jpeg', 'png', 'webp'], true)) continue;

            $base = $file->getBasename('.'.$file->getExtension());
            $index[$this->normalizeImageKey($base)] = $file->getPathname();
            $index[$this->normalizeImageKey($file->getBasename())] = $file->getPathname();
        }

        return $index;
    }

    private function normalizeImageKey(string $value): string
    {
        $v = Str::of($value)->trim()->lower();
        $v = Str::of(Str::ascii($v->toString()))->lower();
        $v = preg_replace('/\.[a-z0-9]+$/', '', $v) ?? $v;
        $v = preg_replace('/[^a-z0-9]+/', '', $v) ?? $v;

        return (string) $v;
    }

    private function asUploadedFile(string $path): UploadedFile
    {
        return new UploadedFile(
            $path,
            basename($path),
            null,
            null,
            true,
        );
    }
}
