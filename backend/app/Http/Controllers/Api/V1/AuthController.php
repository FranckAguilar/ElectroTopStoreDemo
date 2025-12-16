<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\LoginRequest;
use App\Http\Requests\Api\V1\RegisterRequest;
use App\Http\Resources\V1\UserResource;
use App\Services\AuthService;
use App\Services\CartService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    public function __construct(
        private readonly AuthService $auth,
        private readonly CartService $carts,
    )
    {
    }

    private function sessionId(Request $request): ?string
    {
        $header = $request->header('X-Session-Id');

        return is_string($header) && $header !== '' ? $header : null;
    }

    public function register(RegisterRequest $request): JsonResponse
    {
        $user = $this->auth->register($request->validated());
        $token = $this->auth->issueToken($user);

        if ($sessionId = $this->sessionId($request)) {
            $this->carts->mergeSessionCartIntoUser($user, $sessionId);
        }

        return response()->json([
            'token' => $token,
            'user' => new UserResource($user->load('role')),
        ], 201);
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $result = $this->auth->attemptLogin(
            $request->validated('email'),
            $request->validated('password'),
        );

        if (! $result) {
            return response()->json(['message' => 'Invalid credentials.'], 401);
        }

        if ($sessionId = $this->sessionId($request)) {
            $this->carts->mergeSessionCartIntoUser($result['user'], $sessionId);
        }

        return response()->json([
            'token' => $result['token'],
            'user' => new UserResource($result['user']->load('role')),
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'user' => new UserResource($request->user()->load('role')),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $this->auth->logout($request->user());

        return response()->json(['ok' => true]);
    }
}
