<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

/**
 * @mixin \App\Models\Payment
 */
class PaymentResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'order_id' => $this->order_id,
            'payment_method_id' => $this->payment_method_id,
            'amount' => (string) $this->amount,
            'transaction_reference' => $this->transaction_reference,
            'proof_path' => $this->proof_path,
            'proof_url' => $this->proof_path ? Storage::disk('public')->url($this->proof_path) : null,
            'status' => $this->status,
            'paid_at' => $this->paid_at,
            'payment_method' => $this->whenLoaded('paymentMethod', fn () => new PaymentMethodResource($this->paymentMethod)),
            'order' => $this->whenLoaded('order', fn () => [
                'id' => $this->order->id,
                'user_id' => $this->order->user_id,
                'total_amount' => (string) $this->order->total_amount,
                'user' => $this->order->relationLoaded('user') ? [
                    'id' => $this->order->user?->id,
                    'name' => $this->order->user?->name,
                    'email' => $this->order->user?->email,
                ] : null,
            ]),
            'created_at' => $this->created_at,
        ];
    }
}
