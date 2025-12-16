<p align="center"><a href="https://laravel.com" target="_blank"><img src="https://raw.githubusercontent.com/laravel/art/master/logo-lockup/5%20SVG/2%20CMYK/1%20Full%20Color/laravel-logolockup-cmyk-red.svg" width="400" alt="Laravel Logo"></a></p>

<p align="center">
<a href="https://github.com/laravel/framework/actions"><img src="https://github.com/laravel/framework/workflows/tests/badge.svg" alt="Build Status"></a>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://img.shields.io/packagist/dt/laravel/framework" alt="Total Downloads"></a>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://img.shields.io/packagist/v/laravel/framework" alt="Latest Stable Version"></a>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://img.shields.io/packagist/l/laravel/framework" alt="License"></a>
</p>

## ElectroTopStore API

Base path: `/api/v1`

Authentication: `Authorization: Bearer <token>` (token guard using `users.api_token` hashed with SHA-256).

Guest cart:
- Use `POST /api/v1/cart/session` to get a `session_id`
- Send `X-Session-Id: <session_id>` to use the guest cart endpoints (`/api/v1/cart`, `/api/v1/cart/items`)
- If you later `login/register` with the same `X-Session-Id`, the cart is merged into your user cart.

Uploads:
- Product images, brand logos, and payment proofs are stored on disk `public` (run `php artisan storage:link` to serve `/storage/*`).

## Statuses (official)

Orders (`order_statuses.name`):
- `pending` → `paid` | `cancelled`
- `paid` → `shipped` | `cancelled`
- `shipped` → `delivered`
- `delivered` (final)
- `cancelled` (final)

Payments (`payments.status`):
- `pending` → `paid` | `failed` | `cancelled`
- `failed` → `paid` | `cancelled`
- `paid` (final)
- `cancelled` (final)

Endpoints:
- `POST /api/v1/auth/register`, `POST /api/v1/auth/login`, `GET /api/v1/auth/me`, `POST /api/v1/auth/logout`
- `GET /api/v1/categories`, `GET /api/v1/brands`, `GET /api/v1/products`, `GET /api/v1/products/{id}`
- `GET /api/v1/payment-methods`
- `GET /api/v1/cart`, `POST /api/v1/cart/items`, `PATCH /api/v1/cart/items/{id}`, `DELETE /api/v1/cart/items/{id}`, `POST /api/v1/cart/checkout` (requires `payment_method_id`)
- `GET /api/v1/orders`, `GET /api/v1/orders/{id}`
- `POST /api/v1/orders/{id}/payment-proof` (multipart: `proof`, optional `transaction_reference`, optional `payment_method_id`)
- `POST /api/v1/quotes`, `GET /api/v1/faqs`, `GET /api/v1/settings`

Admin (requires `auth:api` + role `admin`):
- `GET|POST|PUT|DELETE /api/v1/admin/categories`
- `GET|POST|PUT|DELETE /api/v1/admin/brands`
- `POST /api/v1/admin/brands/{id}/logo` (multipart field `logo`)
- `GET|POST|PUT|DELETE /api/v1/admin/products`
- `POST /api/v1/admin/products/{id}/images` (multipart field `image`)
- `PATCH /api/v1/admin/products/{id}/images/reorder` (JSON `{ "image_ids": [1,2,3] }`)
- `POST /api/v1/admin/product-images/{id}/primary`
- `DELETE /api/v1/admin/product-images/{id}`
- `GET|POST|PUT|DELETE /api/v1/admin/payment-methods`
- `GET|POST|PUT|DELETE /api/v1/admin/faqs`
- `GET|POST|PUT|DELETE /api/v1/admin/settings`
- `GET|PATCH /api/v1/admin/orders` (filters: `user_id`, `order_status_id`, `q`)
- `GET|PATCH /api/v1/admin/payments` (filters: `order_id`, `status`)
- `GET|PATCH /api/v1/admin/quotes` (filters: `status`, `product_id`, `q`)

## About Laravel

Laravel is a web application framework with expressive, elegant syntax. We believe development must be an enjoyable and creative experience to be truly fulfilling. Laravel takes the pain out of development by easing common tasks used in many web projects, such as:

- [Simple, fast routing engine](https://laravel.com/docs/routing).
- [Powerful dependency injection container](https://laravel.com/docs/container).
- Multiple back-ends for [session](https://laravel.com/docs/session) and [cache](https://laravel.com/docs/cache) storage.
- Expressive, intuitive [database ORM](https://laravel.com/docs/eloquent).
- Database agnostic [schema migrations](https://laravel.com/docs/migrations).
- [Robust background job processing](https://laravel.com/docs/queues).
- [Real-time event broadcasting](https://laravel.com/docs/broadcasting).

Laravel is accessible, powerful, and provides tools required for large, robust applications.

## Learning Laravel

Laravel has the most extensive and thorough [documentation](https://laravel.com/docs) and video tutorial library of all modern web application frameworks, making it a breeze to get started with the framework. You can also check out [Laravel Learn](https://laravel.com/learn), where you will be guided through building a modern Laravel application.

If you don't feel like reading, [Laracasts](https://laracasts.com) can help. Laracasts contains thousands of video tutorials on a range of topics including Laravel, modern PHP, unit testing, and JavaScript. Boost your skills by digging into our comprehensive video library.

## Laravel Sponsors

We would like to extend our thanks to the following sponsors for funding Laravel development. If you are interested in becoming a sponsor, please visit the [Laravel Partners program](https://partners.laravel.com).

### Premium Partners

- **[Vehikl](https://vehikl.com)**
- **[Tighten Co.](https://tighten.co)**
- **[Kirschbaum Development Group](https://kirschbaumdevelopment.com)**
- **[64 Robots](https://64robots.com)**
- **[Curotec](https://www.curotec.com/services/technologies/laravel)**
- **[DevSquad](https://devsquad.com/hire-laravel-developers)**
- **[Redberry](https://redberry.international/laravel-development)**
- **[Active Logic](https://activelogic.com)**

## Contributing

Thank you for considering contributing to the Laravel framework! The contribution guide can be found in the [Laravel documentation](https://laravel.com/docs/contributions).

## Code of Conduct

In order to ensure that the Laravel community is welcoming to all, please review and abide by the [Code of Conduct](https://laravel.com/docs/contributions#code-of-conduct).

## Security Vulnerabilities

If you discover a security vulnerability within Laravel, please send an e-mail to Taylor Otwell via [taylor@laravel.com](mailto:taylor@laravel.com). All security vulnerabilities will be promptly addressed.

## License

The Laravel framework is open-sourced software licensed under the [MIT license](https://opensource.org/licenses/MIT).
