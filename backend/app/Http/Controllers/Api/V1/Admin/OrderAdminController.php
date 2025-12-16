<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Admin\UpdateOrderAdminRequest;
use App\Http\Resources\V1\OrderResource;
use App\Models\Order;
use App\Services\WorkflowService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class OrderAdminController extends Controller
{
    public function __construct(private readonly WorkflowService $workflow)
    {
    }

    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Order::query()
            ->with(['user.role', 'status', 'items.product', 'payments.paymentMethod'])
            ->orderByDesc('id');

        if ($request->filled('user_id')) {
            $query->where('user_id', (int) $request->query('user_id'));
        }

        if ($request->filled('order_status_id')) {
            $query->where('order_status_id', (int) $request->query('order_status_id'));
        }

        if ($request->filled('q')) {
            $q = (string) $request->query('q');
            $query->whereHas('user', function ($qb) use ($q) {
                $qb->where('email', 'like', "%{$q}%")
                    ->orWhere('name', 'like', "%{$q}%");
            });
        }

        return OrderResource::collection($query->paginate(20));
    }

    public function show(Order $order): JsonResponse
    {
        return response()->json([
            'order' => new OrderResource($order->load(['user.role', 'status', 'items.product', 'payments.paymentMethod'])),
        ]);
    }

    public function update(UpdateOrderAdminRequest $request, Order $order): JsonResponse
    {
        $order = $this->workflow->applyOrderAdminUpdate($order->load('status'), $request->validated());

        return response()->json([
            'order' => new OrderResource($order->load(['user.role', 'status', 'items.product', 'payments.paymentMethod'])),
        ]);
    }
}
