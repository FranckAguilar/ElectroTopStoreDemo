<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Admin\UpdateUserAdminRequest;
use App\Http\Resources\V1\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class UserAdminController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = User::query()
            ->with('role')
            ->orderByDesc('id');

        if ($request->filled('role_id')) {
            $query->where('role_id', (int) $request->query('role_id'));
        }

        if ($request->filled('q')) {
            $q = (string) $request->query('q');
            $query->where(function ($qb) use ($q) {
                $qb->where('email', 'like', "%{$q}%")
                    ->orWhere('name', 'like', "%{$q}%");
            });
        }

        return UserResource::collection($query->paginate(20));
    }

    public function show(User $user): JsonResponse
    {
        return response()->json([
            'user' => new UserResource($user->load('role')),
        ]);
    }

    public function update(UpdateUserAdminRequest $request, User $user): JsonResponse
    {
        $user->fill($request->validated())->save();

        return response()->json([
            'user' => new UserResource($user->load('role')),
        ]);
    }

    public function destroy(User $user): JsonResponse
    {
        $user->delete();

        return response()->json(['ok' => true]);
    }
}

