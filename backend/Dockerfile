# Render deployment (Laravel + Apache)
#
# Render supports Docker-based deployments reliably for PHP/Laravel.
# This Dockerfile is scoped to the `backend/` folder.

FROM composer:2 AS vendor
WORKDIR /app

COPY composer.json composer.lock ./
# Laravel ejecuta scripts que llaman a `php artisan ...` durante `composer install`.
# En este stage solo tenemos composer.* (no el proyecto completo), así que desactivamos scripts.
RUN composer install --no-dev --prefer-dist --no-interaction --no-progress --optimize-autoloader --no-scripts

FROM php:8.4-apache

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    libpq-dev \
    libzip-dev \
    unzip \
  && docker-php-ext-install pdo_pgsql zip \
  && a2enmod rewrite headers \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /var/www/html

COPY . .
COPY --from=vendor /app/vendor ./vendor

# Apache -> Laravel public/
RUN sed -ri 's!/var/www/html!/var/www/html/public!g' /etc/apache2/sites-available/000-default.conf \
  && sed -ri 's!/var/www/!/var/www/html/public!g' /etc/apache2/apache2.conf \
  && printf '%s\n' \
    '<Directory /var/www/html/public>' \
    '  AllowOverride All' \
    '  Require all granted' \
    '</Directory>' \
    > /etc/apache2/conf-available/laravel-public.conf \
  && a2enconf laravel-public

# Permissions for Laravel runtime
RUN chown -R www-data:www-data storage bootstrap/cache

RUN chmod +x /var/www/html/render-start.sh

ENV APP_ENV=production \
    APP_DEBUG=false \
    LOG_CHANNEL=stderr

EXPOSE 80

CMD ["/var/www/html/render-start.sh"]
