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

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => false,
];
