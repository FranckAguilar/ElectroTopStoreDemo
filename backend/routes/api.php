<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\BrandController;
use App\Http\Controllers\Api\V1\CartController;
use App\Http\Controllers\Api\V1\CategoryController;
use App\Http\Controllers\Api\V1\FaqController;
use App\Http\Controllers\Api\V1\HomeController;
use App\Http\Controllers\Api\V1\OrderController;
use App\Http\Controllers\Api\V1\PaymentMethodController;
use App\Http\Controllers\Api\V1\ProductController;
use App\Http\Controllers\Api\V1\QuoteController;
use App\Http\Controllers\Api\V1\SettingController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function (): void {
    Route::get('/health', fn () => ['ok' => true]);

    Route::prefix('auth')->group(function (): void {
        Route::post('/register', [AuthController::class, 'register']);
        Route::post('/login', [AuthController::class, 'login']);

        Route::middleware('auth:api')->group(function (): void {
            Route::get('/me', [AuthController::class, 'me']);
            Route::post('/logout', [AuthController::class, 'logout']);
        });
    });

    Route::get('/categories', [CategoryController::class, 'index']);
    Route::get('/brands', [BrandController::class, 'index']);

    Route::get('/products', [ProductController::class, 'index']);
    Route::get('/products/{product}', [ProductController::class, 'show']);

    Route::get('/payment-methods', [PaymentMethodController::class, 'index']);

    Route::get('/faqs', [FaqController::class, 'index']);
    Route::get('/settings', [SettingController::class, 'index']);

    Route::get('/home/recommended', [HomeController::class, 'recommended']);
    Route::get('/home/best-sellers', [HomeController::class, 'bestSellers']);

    Route::post('/quotes', [QuoteController::class, 'store']);

    Route::post('/cart/session', [CartController::class, 'createSession']);
    Route::get('/cart', [CartController::class, 'show']);
    Route::post('/cart/items', [CartController::class, 'storeItem']);
    Route::patch('/cart/items/{item}', [CartController::class, 'updateItem']);
    Route::delete('/cart/items/{item}', [CartController::class, 'destroyItem']);

    Route::middleware(['auth:api', 'role:admin'])->prefix('admin')->group(function (): void {
        Route::get('/dashboard', [\App\Http\Controllers\Api\V1\Admin\DashboardAdminController::class, 'show']);
        Route::get('/roles', [\App\Http\Controllers\Api\V1\Admin\RoleAdminController::class, 'index']);
        Route::apiResource('users', \App\Http\Controllers\Api\V1\Admin\UserAdminController::class)->only(['index', 'show', 'update', 'destroy']);

        Route::get('/home', [\App\Http\Controllers\Api\V1\Admin\HomeAdminController::class, 'show']);
        Route::put('/home', [\App\Http\Controllers\Api\V1\Admin\HomeAdminController::class, 'update']);

        Route::apiResource('categories', \App\Http\Controllers\Api\V1\Admin\CategoryAdminController::class);
        Route::apiResource('brands', \App\Http\Controllers\Api\V1\Admin\BrandAdminController::class);
        Route::apiResource('products', \App\Http\Controllers\Api\V1\Admin\ProductAdminController::class);

        Route::post('/brands/{brand}/logo', [\App\Http\Controllers\Api\V1\Admin\BrandLogoAdminController::class, 'store']);

        Route::post('/products/{product}/images', [\App\Http\Controllers\Api\V1\Admin\ProductImageAdminController::class, 'store']);
        Route::patch('/products/{product}/images/reorder', [\App\Http\Controllers\Api\V1\Admin\ProductImageAdminController::class, 'reorder']);
        Route::post('/product-images/{image}/primary', [\App\Http\Controllers\Api\V1\Admin\ProductImageAdminController::class, 'setPrimary']);
        Route::delete('/product-images/{image}', [\App\Http\Controllers\Api\V1\Admin\ProductImageAdminController::class, 'destroy']);

        Route::apiResource('payment-methods', \App\Http\Controllers\Api\V1\Admin\PaymentMethodAdminController::class);
        Route::apiResource('faqs', \App\Http\Controllers\Api\V1\Admin\FaqAdminController::class);
        Route::apiResource('settings', \App\Http\Controllers\Api\V1\Admin\SettingAdminController::class)->only(['index', 'store', 'show', 'update', 'destroy']);

        Route::apiResource('orders', \App\Http\Controllers\Api\V1\Admin\OrderAdminController::class)->only(['index', 'show', 'update']);
        Route::apiResource('payments', \App\Http\Controllers\Api\V1\Admin\PaymentAdminController::class)->only(['index', 'show', 'update']);
        Route::apiResource('quotes', \App\Http\Controllers\Api\V1\Admin\QuoteAdminController::class)->only(['index', 'show', 'update']);
    });

    Route::middleware('auth:api')->group(function (): void {
        Route::post('/cart/checkout', [CartController::class, 'checkout']);

        Route::get('/orders', [OrderController::class, 'index']);
        Route::get('/orders/{order}', [OrderController::class, 'show']);

        Route::post('/orders/{order}/payment-proof', [\App\Http\Controllers\Api\V1\PaymentProofController::class, 'store']);
    });
});
