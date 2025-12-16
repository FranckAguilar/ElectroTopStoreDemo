<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\ShoppingCart
 */
class CartResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $total = $this->items
            ? $this->items->sum(fn ($i) => ((float) $i->unit_price) * $i->quantity)
            : 0;

        return [
            'id' => $this->id,
            'total_amount' => number_format($total, 2, '.', ''),
            'items' => CartItemResource::collection($this->whenLoaded('items')),
        ];
    }
}

