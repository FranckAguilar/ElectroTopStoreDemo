# Importar productos en lote (CSV)

Este proyecto incluye el comando `php artisan products:import` para cargar muchos productos rápidamente y asociar imágenes desde una carpeta, usando `stock_quantity=10` por defecto.

## 1) Preparar el CSV

Encabezados soportados (usa los que necesites):

- `codigo` (requerido)
- `name` (requerido)
- `description` (opcional)
- `price` (requerido)
- `price` puede ir vacío si usas `--default-price`
- `stock_quantity` (opcional; si no viene se usa `--default-stock`)
- `status` (opcional: `active` / `inactive`)
- Categoría (elige una forma):
  - `category_id` (id numérico) o
  - `category_slug` o
  - `category` (nombre)
- Marca (elige una forma):
  - `brand_id` (id numérico) o
  - `brand_slug` o
  - `brand` (nombre)
- Imágenes:
  - `images` (opcional) con nombres de archivo separados por `|`, ej: `img1.jpg|img2.png`

Ejemplo: `backend/import/products.example.csv`

## 2) Poner las imágenes en una carpeta

Las imágenes deben estar en una sola carpeta (no recursivo). Extensiones soportadas: `jpg`, `jpeg`, `png`, `webp`.

Si no llenas `images`, el importador intenta buscar por `codigo` o `name`.

## Import autom├ítico (Render) sin usar Shell

Si quieres que **Render cargue el cat├álogo autom├íticamente** (sin entrar a la Shell de Render), puedes:

1) Copiar tus im├ígenes al repo en `backend/import/assets/products/` (con el mismo nombre que en la columna `images` del CSV).
2) En Render, configurar estas variables de entorno:
   - `SEED_CATALOG_FROM_CSV=true`
   - `SEED_PRODUCTS_CSV=import/products.example.csv`
   - `SEED_PRODUCTS_IMAGES_DIR=import/assets/products`
   - `SEED_PRODUCTS_PUBLIC_DIR=products-static`

Con eso, el seeder `DatabaseSeeder` llama a `CsvCatalogSeeder` **solo si la tabla `products` est├í vac├ía**, crea productos y copia im├ígenes a `storage/app/public/products-static/`.

## 3) Ejecutar

Primero prueba con simulación:

```bash
php artisan products:import "C:\ruta\products.csv" --images="C:\ruta\imagenes" --dry-run
```

Luego ejecuta real:

```bash
php artisan products:import "C:\ruta\products.csv" --images="C:\ruta\imagenes" --default-stock=10
```

Si tu CSV no tiene precios todavía (o vienen vacíos), puedes poner un precio por defecto (ej: 0):

```bash
php artisan products:import "C:\ruta\products.csv" --images="C:\ruta\imagenes" --default-price=0
```

Si quieres que cree marcas/categorías que no existan:

```bash
php artisan products:import "C:\ruta\products.csv" --images="C:\ruta\imagenes" --create-missing
```

Si tu CSV usa `;` en vez de `,`:

```bash
php artisan products:import "C:\ruta\products.csv" --images="C:\ruta\imagenes" --delimiter=";"
```
