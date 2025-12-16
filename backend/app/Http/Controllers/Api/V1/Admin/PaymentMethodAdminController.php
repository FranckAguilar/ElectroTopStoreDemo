<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Admin\StorePaymentMethodRequest;
use App\Http\Requests\Api\V1\Admin\UpdatePaymentMethodRequest;
use App\Http\Resources\V1\PaymentMethodResource;
use App\Models\PaymentMethod;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class PaymentMethodAdminController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        return PaymentMethodResource::collection(
            PaymentMethod::query()->orderBy('name')->paginate(20)
        );
    }

    public function store(StorePaymentMethodRequest $request): JsonResponse
    {
        /** @var PaymentMethod $method */
        $method = PaymentMethod::query()->create($request->validated());

        return response()->json([
            'payment_method' => new PaymentMethodResource($method),
        ], 201);
    }

    public function show(PaymentMethod $paymentMethod): JsonResponse
    {
        return response()->json([
            'payment_method' => new PaymentMethodResource($paymentMethod),
        ]);
    }

    public function update(UpdatePaymentMethodRequest $request, PaymentMethod $paymentMethod): JsonResponse
    {
        $paymentMethod->fill($request->validated())->save();

        return response()->json([
            'payment_method' => new PaymentMethodResource($paymentMethod),
        ]);
    }

    public function destroy(PaymentMethod $paymentMethod): JsonResponse
    {
        $paymentMethod->delete();

        return response()->json(['ok' => true]);
    }
}

