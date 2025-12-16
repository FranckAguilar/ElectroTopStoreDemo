<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\OrderItem
 */
class OrderItemResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'quantity' => $this->quantity,
            'unit_price' => (string) $this->unit_price,
            'subtotal' => (string) $this->subtotal,
            'product' => $this->whenLoaded('product', fn () => new ProductResource($this->product->loadMissing(['category', 'brand', 'images']))),
        ];
    }
}

