# Deploy: Vercel (frontend) + Render (backend)

Este proyecto es un **monorepo**:
- `frontend/` → Vite + React + Tailwind (clientes + admin)
- `backend/` → Laravel API + PostgreSQL

## 1) Subir a GitHub

1. Crea un repo (por ejemplo `ElectroTopStore`) en GitHub.
2. Desde la carpeta del proyecto:
   - `git init`
   - `git add .`
   - `git commit -m "init"`
   - `git branch -M main`
   - `git remote add origin <URL_DEL_REPO>`
   - `git push -u origin main`

## 2) Frontend en Vercel

1. En Vercel: **New Project** → importa el repo.
2. Configura:
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Variables de entorno (Vercel → Project → Settings → Environment Variables):
   - `VITE_API_BASE_URL = https://TU_BACKEND_RENDER.onrender.com/api/v1`

Notas:
- `frontend/vercel.json` ya está para que al refrescar rutas tipo `/productos` no dé 404 (React Router).

## 3) Backend en Render (Laravel + PostgreSQL)

### A) Crear la base de datos
1. Render → **New** → **PostgreSQL**
2. Copia los datos de conexión (host, db, user, password).

### B) Crear el Web Service (Docker)
1. Render → **New** → **Web Service**
2. Conecta el mismo repo de GitHub.
3. Configura:
   - **Root Directory**: `backend`
   - **Environment**: `Docker`

### C) Variables de entorno en Render
En Render → Service → **Environment** agrega:
- `APP_NAME=ElectroTopStore`
- `APP_ENV=production`
- `APP_DEBUG=false`
- `APP_URL=https://TU_BACKEND_RENDER.onrender.com`
- `APP_KEY=base64:...`  (générala en local con `php artisan key:generate --show`)
- `DB_CONNECTION=pgsql`
- `DB_HOST=...`
- `DB_PORT=5432`
- `DB_DATABASE=...`
- `DB_USERNAME=...`
- `DB_PASSWORD=...`
- `FILESYSTEM_DISK=public`
- `LOG_CHANNEL=stderr`

### D) Qué hace el contenedor al iniciar
El `backend/render-start.sh` ejecuta:
- `php artisan storage:link` (si ya existe, lo ignora)
- `php artisan migrate --force`
- arranca Apache

### E) Importante sobre imágenes subidas
En Render, el filesystem del contenedor puede ser **efímero** (en redeploy se puede perder).
Si quieres conservar imágenes/logos/comprobantes de pago en producción, lo recomendado es:
- S3 / Cloudinary / Storage externo, o
- un disco persistente (si tu plan lo permite).

## 4) CORS
Cuando el frontend esté en Vercel y el backend en Render, son dominios distintos.
Si en el navegador te sale error de CORS, hay que permitir el dominio de Vercel en `backend/config/cors.php`.

