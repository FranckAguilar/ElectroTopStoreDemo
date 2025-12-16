<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Product;
use Illuminate\Http\JsonResponse;

class DashboardAdminController extends Controller
{
    public function show(): JsonResponse
    {
        $recentOrders = Order::query()
            ->with([
                'user:id,name,email',
                'status:id,name',
            ])
            ->orderByDesc('id')
            ->limit(5)
            ->get(['id', 'user_id', 'order_status_id', 'total_amount', 'placed_at']);

        return response()->json([
            'stats' => [
                'products' => Product::query()->count(),
                'orders' => Order::query()->count(),
                'payments' => Payment::query()->count(),
            ],
            'recent_orders' => $recentOrders->map(fn (Order $o) => [
                'id' => $o->id,
                'total_amount' => (string) $o->total_amount,
                'status' => $o->status?->name,
                'placed_at' => $o->placed_at?->toISOString(),
                'user' => $o->user ? [
                    'id' => $o->user->id,
                    'name' => $o->user->name,
                    'email' => $o->user->email,
                ] : null,
            ])->values(),
        ]);
    }
}

