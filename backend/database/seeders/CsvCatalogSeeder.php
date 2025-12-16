<?php

namespace Database\Seeders;

use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use App\Models\ProductImage;
use Illuminate\Database\Seeder;
use Illuminate\Http\File as HttpFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class CsvCatalogSeeder extends Seeder
{
    public function run(): void
    {
        if (! filter_var((string) env('SEED_CATALOG_FROM_CSV', 'false'), FILTER_VALIDATE_BOOL)) {
            return;
        }

        $csvRelative = (string) env('SEED_PRODUCTS_CSV', 'import/products.example.csv');
        $imagesDirRelative = (string) env('SEED_PRODUCTS_IMAGES_DIR', 'import/assets/products');

        $csvPath = base_path($csvRelative);
        $imagesDir = base_path($imagesDirRelative);

        if (! is_file($csvPath)) {
            return;
        }

        $delimiter = (string) env('SEED_PRODUCTS_CSV_DELIMITER', ',');
        $defaultStock = (int) env('SEED_PRODUCTS_DEFAULT_STOCK', 100);
        $defaultPrice = (string) env('SEED_PRODUCTS_DEFAULT_PRICE', '0');

        $rows = new \SplFileObject($csvPath);
        $rows->setFlags(\SplFileObject::READ_CSV | \SplFileObject::SKIP_EMPTY | \SplFileObject::DROP_NEW_LINE);
        $rows->setCsvControl($delimiter);

        /** @var array<string, int>|null $header */
        $header = null;

        foreach ($rows as $row) {
            if (! is_array($row) || (count($row) === 1 && ($row[0] === null || trim((string) $row[0]) === ''))) {
                continue;
            }

            if ($header === null) {
                $header = $this->normalizeHeaderRow($row);
                continue;
            }

            $data = $this->rowToAssoc($header, $row);
            $normalized = $this->normalizeRow($data);
            if (! $normalized) {
                continue;
            }

            $category = Category::query()->where('slug', Str::slug($normalized['category']))->first()
                ?: Category::query()->where('name', $normalized['category'])->first();
            $brand = Brand::query()->where('slug', Str::slug($normalized['brand']))->first()
                ?: Brand::query()->where('name', $normalized['brand'])->first();

            if (! $category || ! $brand) {
                continue;
            }

            $product = Product::query()->updateOrCreate(
                ['codigo' => $normalized['codigo']],
                [
                    'name' => $normalized['name'],
                    'description' => $normalized['description'],
                    'category_id' => $category->id,
                    'brand_id' => $brand->id,
                    'price' => $normalized['price'] ?? $defaultPrice,
                    'stock_quantity' => $normalized['stock_quantity'] ?? $defaultStock,
                    'status' => $normalized['status'] ?? 'active',
                ],
            );

            $this->seedProductImages($product, $normalized['images'] ?? null, $imagesDir);
        }
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
     * @return array{codigo:string,name:string,description:?string,category:string,brand:string,price:?string,stock_quantity:?int,status:?string,images:?string}|null
     */
    private function normalizeRow(array $row): ?array
    {
        $codigo = trim((string) ($row['codigo'] ?? ''));
        $name = trim((string) ($row['name'] ?? $row['nombre'] ?? ''));
        $category = trim((string) ($row['category'] ?? $row['categoria'] ?? ''));
        $brand = trim((string) ($row['brand'] ?? $row['marca'] ?? ''));

        if ($codigo === '' || $name === '' || $category === '' || $brand === '') {
            return null;
        }

        $description = $row['description'] ?? $row['descripcion'] ?? null;
        $description = is_string($description) ? trim($description) : null;
        if ($description === '') {
            $description = null;
        }

        $price = trim((string) ($row['price'] ?? $row['precio'] ?? ''));
        if ($price === '') {
            $price = null;
        }

        $stock = trim((string) ($row['stock_quantity'] ?? $row['stock'] ?? ''));
        $stockInt = null;
        if ($stock !== '') {
            $stockInt = max(0, (int) $stock);
        }

        $status = trim((string) ($row['status'] ?? ''));
        if ($status === '') {
            $status = null;
        }

        $images = trim((string) ($row['images'] ?? $row['image'] ?? $row['imagen'] ?? ''));
        if ($images === '') {
            $images = null;
        }

        return [
            'codigo' => $codigo,
            'name' => $name,
            'description' => $description,
            'category' => $category,
            'brand' => $brand,
            'price' => $price,
            'stock_quantity' => $stockInt,
            'status' => $status,
            'images' => $images,
        ];
    }

    private function seedProductImages(Product $product, ?string $images, string $imagesDir): void
    {
        if ($images === null || $images === '') {
            return;
        }

        $disk = Storage::disk('public');
        $destDir = (string) env('SEED_PRODUCTS_PUBLIC_DIR', 'products-static');

        $files = array_values(array_filter(array_map('trim', explode('|', $images))));
        if (count($files) === 0) {
            return;
        }

        $nextOrder = (int) ($product->images()->max('order') ?? -1) + 1;

        foreach ($files as $filename) {
            $src = rtrim($imagesDir, DIRECTORY_SEPARATOR).DIRECTORY_SEPARATOR.$filename;
            if (! is_file($src)) {
                continue;
            }

            $destPath = trim($destDir, '/').'/'.$filename;
            if (! $disk->exists($destPath)) {
                $disk->putFileAs(trim($destDir, '/'), new HttpFile($src), $filename);
            }

            $existing = ProductImage::query()
                ->where('product_id', $product->id)
                ->where('image_path', $destPath)
                ->exists();

            if ($existing) {
                continue;
            }

            $product->images()->create([
                'image_path' => $destPath,
                'order' => $nextOrder,
            ]);
            $nextOrder++;
        }
    }
}

