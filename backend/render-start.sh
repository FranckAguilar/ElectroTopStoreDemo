#!/usr/bin/env bash
set -euo pipefail

if [[ ! -f ".env" && -n "${APP_ENV:-}" ]]; then
  echo "No .env file present; using Render environment variables."
fi

php artisan storage:link || true
php artisan migrate --force
php artisan db:seed --force

exec apache2-foreground
