<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\SubmitPaymentProofRequest;
use App\Http\Resources\V1\PaymentResource;
use App\Models\Order;
use App\Models\Payment;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class PaymentProofController extends Controller
{
    public function store(SubmitPaymentProofRequest $request, Order $order): JsonResponse
    {
        if ($order->user_id !== $request->user()->id) {
            abort(404);
        }

        $data = $request->validated();

        /** @var Payment $payment */
        $payment = DB::transaction(function () use ($order, $data) {
            $payment = Payment::query()
                ->where('order_id', $order->id)
                ->orderByDesc('id')
                ->lockForUpdate()
                ->first();

            $paymentMethodId = $data['payment_method_id'] ?? $order->payment_method_id;

            if (! $paymentMethodId) {
                abort(422, 'payment_method_id is required for this order.');
            }

            $file = $data['proof'];
            $ext = $file->getClientOriginalExtension() ?: 'jpg';
            $filename = Str::uuid()->toString().'.'.$ext;
            $path = $file->storePubliclyAs("payment_proofs/{$order->id}", $filename, 'public');

            if ($payment) {
                if ($payment->proof_path) {
                    Storage::disk('public')->delete($payment->proof_path);
                }

                $payment->fill([
                    'payment_method_id' => $paymentMethodId,
                    'transaction_reference' => $data['transaction_reference'] ?? $payment->transaction_reference,
                    'proof_path' => $path,
                    'status' => 'pending',
                    'paid_at' => null,
                ])->save();

                return $payment;
            }

            return Payment::query()->create([
                'order_id' => $order->id,
                'payment_method_id' => $paymentMethodId,
                'amount' => $order->total_amount,
                'transaction_reference' => $data['transaction_reference'] ?? null,
                'proof_path' => $path,
                'status' => 'pending',
                'paid_at' => null,
            ]);
        });

        return response()->json([
            'payment' => new PaymentResource($payment->load(['order', 'paymentMethod'])),
        ], 201);
    }
}

