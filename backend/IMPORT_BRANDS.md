# Importar marcas en lote (CSV)

Comando: `php artisan brands:import`

## CSV

Encabezados soportados:

- `name` (requerido)
- `slug` (opcional)
- `logo` (opcional, nombre de archivo)

Si `logo` viene vacío, el importador intenta encontrar un archivo en `--logos` por `slug` o `name`.

Ejemplo: `backend/import/brands.example.csv`

## Ejecutar

Simulación:

```bash
php artisan brands:import "C:\ruta\brands.csv" --logos="C:\ruta\logos" --dry-run
```

Import real:

```bash
php artisan brands:import "C:\ruta\brands.csv" --logos="C:\ruta\logos"
```

Si quieres crear marcas que no existan:

```bash
php artisan brands:import "C:\ruta\brands.csv" --logos="C:\ruta\logos" --create-missing
```

