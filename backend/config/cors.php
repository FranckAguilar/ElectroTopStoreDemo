<?php

$envOrigins = env('CORS_ALLOWED_ORIGINS');
$allowedOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
];

if (is_string($envOrigins) && trim($envOrigins) !== '') {
    $allowedOrigins = array_values(array_filter(array_map('trim', explode(',', $envOrigins))));
}

return [
    'paths' => ['api/*'],

    'allowed_methods' => ['*'],

    'allowed_origins' => $allowedOrigins,

    // Permite deploys de Vercel (incluye preview URLs). CORS solo afecta navegadores.
    // Si quieres restringirlo, define `CORS_ALLOWED_ORIGINS` en Render con el dominio exacto.
    'allowed_origins_patterns' => ['/^https:\\/\\/.*\\.vercel\\.app$/'],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => false,
];
