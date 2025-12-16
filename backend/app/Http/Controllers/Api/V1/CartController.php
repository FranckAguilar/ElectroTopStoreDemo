<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\AddCartItemRequest;
use App\Http\Requests\Api\V1\CheckoutRequest;
use App\Http\Requests\Api\V1\UpdateCartItemRequest;
use App\Http\Resources\V1\CartResource;
use App\Models\CartItem;
use App\Services\CartService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CartController extends Controller
{
    public function __construct(private readonly CartService $carts)
    {
    }

    public function createSession(): JsonResponse
    {
        return response()->json([
            'session_id' => (string) Str::uuid(),
        ], 201);
    }

    private function sessionId(Request $request): ?string
    {
        $header = $request->header('X-Session-Id');

        return is_string($header) && $header !== '' ? $header : null;
    }

    public function show(Request $request): CartResource
    {
        $cart = $this->carts->getOrCreateCart($request->user('api'), $this->sessionId($request));
        $cart->setRelation('items', $this->carts->cartItemsWithProducts($cart));

        return new CartResource($cart);
    }

    public function storeItem(AddCartItemRequest $request): CartResource
    {
        $cart = $this->carts->getOrCreateCart($request->user('api'), $this->sessionId($request));
        $this->carts->addItem(
            $cart,
            $request->validated('product_id'),
            $request->validated('quantity'),
        );

        $cart->setRelation('items', $this->carts->cartItemsWithProducts($cart));

        return new CartResource($cart);
    }

    public function updateItem(UpdateCartItemRequest $request, CartItem $item): CartResource
    {
        $cart = $this->carts->getOrCreateCart($request->user('api'), $this->sessionId($request));

        if ($item->cart_id !== $cart->id) {
            abort(404);
        }

        $this->carts->updateItemQuantity($item, $request->validated('quantity'));
        $cart->setRelation('items', $this->carts->cartItemsWithProducts($cart));

        return new CartResource($cart);
    }

    public function destroyItem(Request $request, CartItem $item): CartResource
    {
        $cart = $this->carts->getOrCreateCart($request->user('api'), $this->sessionId($request));

        if ($item->cart_id !== $cart->id) {
            abort(404);
        }

        $item->delete();
        $cart->setRelation('items', $this->carts->cartItemsWithProducts($cart));

        return new CartResource($cart);
    }

    public function checkout(CheckoutRequest $request): JsonResponse
    {
        $result = $this->carts->checkout(
            $request->user(),
            $request->validated('payment_method_id'),
            $request->validated('shipping_address'),
        );

        return response()->json($result, 201);
    }
}
