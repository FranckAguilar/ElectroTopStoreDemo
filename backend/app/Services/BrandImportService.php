<?php

namespace App\Services;

use App\Models\Brand;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class BrandImportService
{
    private const MAX_ERRORS = 50;

    /**
     * @param  array{
     *   logos_dir?: string|null,
     *   delimiter?: string,
     *   create_missing?: bool,
     *   dry_run?: bool,
     * }  $options
     * @return array{created:int,updated:int,logos_attached:int,skipped:int,errors:array<int,string>}
     */
    public function importCsv(string $csvPath, array $options = []): array
    {
        $delimiter = (string) ($options['delimiter'] ?? ',');
        $createMissing = (bool) ($options['create_missing'] ?? false);
        $dryRun = (bool) ($options['dry_run'] ?? false);
        $logosDir = Arr::get($options, 'logos_dir');

        $result = [
            'created' => 0,
            'updated' => 0,
            'logos_attached' => 0,
            'skipped' => 0,
            'errors' => [],
        ];

        $csvReal = realpath($csvPath) ?: $csvPath;
        if (! is_file($csvReal)) {
            $result['errors'][] = "CSV no encontrado: {$csvReal}";
            return $result;
        }

        if (! Schema::hasTable('brands')) {
            $result['errors'][] = 'Tabla brands no encontrada. Ejecuta primero: php artisan migrate:fresh --seed';
            return $result;
        }

        $logoIndex = $this->buildLogoIndex($logosDir);

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

                $name = $normalized['name'];
                $slug = $normalized['slug'] ?? Str::slug($name);

                $brand = Brand::query()->where('slug', $slug)->first();
                $isNew = ! $brand;

                if (! $brand && $createMissing) {
                    $brand = Brand::query()->create([
                        'name' => $name,
                        'slug' => $slug,
                        'logo_path' => null,
                    ]);
                }

                if (! $brand) {
                    throw new \RuntimeException("Marca no encontrada: {$name} ({$slug})");
                }

                if ($dryRun) {
                    $isNew ? $result['created']++ : $result['updated']++;
                    if ($this->resolveLogoFile($normalized, $logoIndex)) {
                        $result['logos_attached']++;
                    }
                    continue;
                }

                if (! $isNew) {
                    $brand->fill(['name' => $name, 'slug' => $slug])->save();
                    $result['updated']++;
                } else {
                    $result['created']++;
                }

                $logoPath = $this->resolveLogoFile($normalized, $logoIndex);
                if ($logoPath) {
                    $logos = app(BrandLogoService::class);
                    $logos->setLogo($brand, $this->asUploadedFile($logoPath));
                    $result['logos_attached']++;
                }
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
     * @return array{name:string,slug?:string,logo?:string}|null
     */
    private function normalizeRow(array $row): ?array
    {
        $name = trim((string) ($row['name'] ?? $row['nombre'] ?? ''));
        if ($name === '') {
            return null;
        }

        $slug = trim((string) ($row['slug'] ?? ''));
        if ($slug === '') {
            $slug = null;
        }

        $logo = trim((string) ($row['logo'] ?? $row['logo_file'] ?? $row['image'] ?? $row['imagen'] ?? ''));
        if ($logo === '') {
            $logo = null;
        }

        return array_filter([
            'name' => $name,
            'slug' => $slug,
            'logo' => $logo,
        ], static fn ($v) => $v !== null) ?: null;
    }

    /**
     * @param  array<string, string>  $logoIndex
     */
    private function resolveLogoFile(array $row, array $logoIndex): ?string
    {
        $explicit = $row['logo'] ?? null;
        if (is_string($explicit) && $explicit !== '') {
            return $this->findLogoPath($explicit, $logoIndex);
        }

        $name = $row['name'] ?? null;
        $slug = $row['slug'] ?? null;

        if (is_string($slug) && $slug !== '') {
            $path = $this->findLogoPath($slug, $logoIndex);
            if ($path) return $path;
        }

        if (is_string($name) && $name !== '') {
            $path = $this->findLogoPath($name, $logoIndex);
            if ($path) return $path;
        }

        return null;
    }

    /**
     * @param  array<string, string>  $logoIndex
     */
    private function findLogoPath(string $key, array $logoIndex): ?string
    {
        $normalized = $this->normalizeKey($key);
        if (isset($logoIndex[$normalized])) {
            return $logoIndex[$normalized];
        }

        $basename = pathinfo($key, PATHINFO_FILENAME);
        $normalizedBase = $this->normalizeKey($basename);
        if (isset($logoIndex[$normalizedBase])) {
            return $logoIndex[$normalizedBase];
        }

        return null;
    }

    /**
     * @return array<string, string> map(normalized-basename => fullpath)
     */
    private function buildLogoIndex(?string $logosDir): array
    {
        if (! $logosDir) return [];
        $dir = realpath($logosDir) ?: $logosDir;
        if (! is_dir($dir)) return [];

        $index = [];
        $files = File::files($dir);
        foreach ($files as $file) {
            $ext = strtolower($file->getExtension());
            if (! in_array($ext, ['jpg', 'jpeg', 'png', 'webp', 'svg'], true)) continue;

            $base = $file->getBasename('.'.$file->getExtension());
            $index[$this->normalizeKey($base)] = $file->getPathname();
            $index[$this->normalizeKey($file->getBasename())] = $file->getPathname();
        }

        return $index;
    }

    private function normalizeKey(string $value): string
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

