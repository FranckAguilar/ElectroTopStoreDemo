<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\Quote
 */
class QuoteResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'contact_name' => $this->contact_name,
            'contact_email' => $this->contact_email,
            'contact_phone' => $this->contact_phone,
            'quantity' => $this->quantity,
            'message' => $this->message,
            'status' => $this->status,
            'product' => $this->whenLoaded('product', fn () => new ProductResource($this->product->loadMissing(['category', 'brand', 'images']))),
            'user' => $this->whenLoaded('user', fn () => [
                'id' => $this->user?->id,
                'email' => $this->user?->email,
                'name' => $this->user?->name,
            ]),
            'created_at' => $this->created_at,
        ];
    }
}
