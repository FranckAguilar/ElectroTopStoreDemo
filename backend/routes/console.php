<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

use App\Services\BrandImportService;
use App\Services\ProductImportService;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('products:import {csv : Ruta del CSV} {--images= : Carpeta donde están las imágenes} {--default-stock=10 : Stock por defecto si no viene en el CSV} {--default-price= : Precio por defecto si viene vacío en el CSV (ej: 0)} {--delimiter=, : Delimitador CSV (ej: , o ;)} {--create-missing : Crear categorías/marcas si no existen} {--dry-run : No escribe en BD ni storage, solo simula}', function () {
    /** @var string $csv */
    $csv = (string) $this->argument('csv');

    /** @var string|null $images */
    $images = $this->option('images') ? (string) $this->option('images') : null;

    $defaultStock = (int) $this->option('default-stock');
    $defaultPrice = $this->option('default-price');
    $delimiter = (string) $this->option('delimiter');
    $createMissing = (bool) $this->option('create-missing');
    $dryRun = (bool) $this->option('dry-run');

    $service = app(ProductImportService::class);
    $res = $service->importCsv($csv, [
        'images_dir' => $images,
        'default_stock' => $defaultStock,
        'default_price' => $defaultPrice,
        'delimiter' => $delimiter,
        'create_missing' => $createMissing,
        'dry_run' => $dryRun,
    ]);

    $this->info('Import terminado.');
    $this->line("created={$res['created']} updated={$res['updated']} skipped={$res['skipped']} images={$res['images_attached']}");

    /** @var array<int, string> $errors */
    $errors = $res['errors'];
    if (count($errors) > 0) {
        $this->warn('Errores:');
        foreach ($errors as $err) {
            $this->line("- {$err}");
        }
    }
})->purpose('Importa productos desde CSV y asocia imágenes por nombre/archivo.');

Artisan::command('brands:import {csv : Ruta del CSV} {--logos= : Carpeta donde están los logos} {--delimiter=, : Delimitador CSV (ej: , o ;)} {--create-missing : Crear marcas si no existen} {--dry-run : No escribe en BD ni storage, solo simula}', function () {
    /** @var string $csv */
    $csv = (string) $this->argument('csv');

    /** @var string|null $logos */
    $logos = $this->option('logos') ? (string) $this->option('logos') : null;

    $delimiter = (string) $this->option('delimiter');
    $createMissing = (bool) $this->option('create-missing');
    $dryRun = (bool) $this->option('dry-run');

    $service = app(BrandImportService::class);
    $res = $service->importCsv($csv, [
        'logos_dir' => $logos,
        'delimiter' => $delimiter,
        'create_missing' => $createMissing,
        'dry_run' => $dryRun,
    ]);

    $this->info('Import terminado.');
    $this->line("created={$res['created']} updated={$res['updated']} skipped={$res['skipped']} logos={$res['logos_attached']}");

    /** @var array<int, string> $errors */
    $errors = $res['errors'];
    if (count($errors) > 0) {
        $this->warn('Errores:');
        foreach ($errors as $err) {
            $this->line("- {$err}");
        }
    }
})->purpose('Importa marcas desde CSV y asocia logos por nombre/archivo.');
