<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Admin\UpdatePaymentAdminRequest;
use App\Http\Resources\V1\PaymentResource;
use App\Models\Payment;
use App\Services\WorkflowService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class PaymentAdminController extends Controller
{
    public function __construct(private readonly WorkflowService $workflow)
    {
    }

    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Payment::query()
            ->with(['order.user', 'paymentMethod'])
            ->orderByDesc('id');

        if ($request->filled('order_id')) {
            $query->where('order_id', (int) $request->query('order_id'));
        }

        if ($request->filled('status')) {
            $query->where('status', (string) $request->query('status'));
        }

        return PaymentResource::collection($query->paginate(20));
    }

    public function show(Payment $payment): JsonResponse
    {
        return response()->json([
            'payment' => new PaymentResource($payment->load(['order.user', 'paymentMethod'])),
        ]);
    }

    public function update(UpdatePaymentAdminRequest $request, Payment $payment): JsonResponse
    {
        $payment = $this->workflow->applyPaymentAdminUpdate(
            $payment->load(['order.status']),
            $request->validated(),
        );

        return response()->json([
            'payment' => new PaymentResource($payment->load(['order.user', 'paymentMethod'])),
        ]);
    }
}
