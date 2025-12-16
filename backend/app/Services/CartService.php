<?php

namespace App\Services;

use App\Models\CartItem;
use App\Models\Product;
use App\Models\ShoppingCart;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class CartService
{
    public function getOrCreateCart(?User $user, ?string $sessionId): ShoppingCart
    {
        if ($user) {
            return $this->getOrCreateUserCart($user);
        }

        if (! $sessionId) {
            abort(401, 'Unauthenticated.');
        }

        /** @var ShoppingCart $cart */
        $cart = ShoppingCart::query()->firstOrCreate(
            ['session_id' => $sessionId],
            ['user_id' => null],
        );

        return $cart;
    }

    public function getOrCreateUserCart(User $user): ShoppingCart
    {
        /** @var ShoppingCart $cart */
        $cart = ShoppingCart::query()->firstOrCreate(
            ['user_id' => $user->id],
            ['session_id' => null],
        );

        return $cart;
    }

    public function mergeSessionCartIntoUser(User $user, string $sessionId): void
    {
        /** @var ShoppingCart|null $sessionCart */
        $sessionCart = ShoppingCart::query()->where('session_id', $sessionId)->first();

        if (! $sessionCart) {
            return;
        }

        $userCart = $this->getOrCreateUserCart($user);

        $sessionCart->load('items');

        foreach ($sessionCart->items as $item) {
            $this->addItem($userCart, $item->product_id, $item->quantity);
        }

        $sessionCart->delete();
    }

    public function addItem(ShoppingCart $cart, int $productId, int $quantity): CartItem
    {
        /** @var Product $product */
        $product = Product::query()->where('status', 'active')->findOrFail($productId);

        /** @var CartItem|null $item */
        $item = $cart->items()->where('product_id', $product->id)->first();

        if ($item) {
            $item->quantity += $quantity;
            $item->unit_price = $product->price;
            $item->save();

            return $item;
        }

        /** @var CartItem $created */
        $created = $cart->items()->create([
            'product_id' => $product->id,
            'quantity' => $quantity,
            'unit_price' => $product->price,
        ]);

        return $created;
    }

    public function updateItemQuantity(CartItem $item, int $quantity): ?CartItem
    {
        if ($quantity <= 0) {
            $item->delete();

            return null;
        }

        $item->quantity = $quantity;
        $item->save();

        return $item;
    }

    public function cartItemsWithProducts(ShoppingCart $cart): Collection
    {
        return $cart->items()->with('product.category', 'product.brand', 'product.images')->get();
    }

    public function totalAmount(ShoppingCart $cart): string
    {
        return (string) $cart->items()
            ->selectRaw('COALESCE(SUM(quantity * unit_price), 0) as total')
            ->value('total');
    }

    /**
     * @return array{order_id:int,total_amount:string}
     */
    public function checkout(User $user, int $paymentMethodId, ?string $shippingAddress): array
    {
        $cart = $this->getOrCreateUserCart($user);

        return DB::transaction(function () use ($cart, $user, $paymentMethodId, $shippingAddress) {
            $items = $cart->items()->with('product')->lockForUpdate()->get();

            if ($items->isEmpty()) {
                abort(422, 'Cart is empty.');
            }

            $orderStatusId = \App\Models\OrderStatus::query()
                ->firstOrCreate(['name' => 'pending'])
                ->id;

            $total = 0;

            foreach ($items as $item) {
                $product = $item->product;

                if (! $product || $product->status !== 'active') {
                    abort(422, 'Cart contains inactive products.');
                }

                if ($product->stock_quantity < $item->quantity) {
                    abort(422, "Insufficient stock for product {$product->id}.");
                }

                $total += ((float) $item->unit_price) * $item->quantity;
            }

            /** @var \App\Models\Order $order */
            $order = \App\Models\Order::query()->create([
                'user_id' => $user->id,
                'total_amount' => $total,
                'order_status_id' => $orderStatusId,
                'payment_method_id' => $paymentMethodId,
                'shipping_address' => $shippingAddress,
                'placed_at' => now(),
            ]);

            foreach ($items as $item) {
                $product = $item->product;

                $subtotal = ((float) $item->unit_price) * $item->quantity;

                $order->items()->create([
                    'product_id' => $product->id,
                    'quantity' => $item->quantity,
                    'unit_price' => $item->unit_price,
                    'subtotal' => $subtotal,
                ]);

                $product->decrement('stock_quantity', $item->quantity);
            }

            $order->payments()->create([
                'payment_method_id' => $paymentMethodId,
                'amount' => $total,
                'status' => 'pending',
            ]);

            $cart->items()->delete();

            return [
                'order_id' => $order->id,
                'total_amount' => (string) $order->total_amount,
            ];
        });
    }
}
