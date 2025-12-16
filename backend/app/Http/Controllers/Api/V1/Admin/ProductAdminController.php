<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Admin\StoreProductRequest;
use App\Http\Requests\Api\V1\Admin\UpdateProductRequest;
use App\Http\Resources\V1\ProductResource;
use App\Models\Product;
use App\Services\ProductService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ProductAdminController extends Controller
{
    public function __construct(private readonly ProductService $products)
    {
    }

    public function index(\Illuminate\Http\Request $request): AnonymousResourceCollection
    {
        return ProductResource::collection($this->products->list([
            ...$request->query(),
            'per_page' => (int) ($request->query('per_page', 20)),
            'sort_by' => (string) $request->query('sort_by', 'id'),
            'sort_dir' => (string) $request->query('sort_dir', 'asc'),
        ]));
    }

    public function store(StoreProductRequest $request): JsonResponse
    {
        /** @var Product $product */
        $product = Product::query()->create($request->validated());

        return response()->json([
            'product' => new ProductResource($product->load(['category', 'brand', 'images'])),
        ], 201);
    }

    public function show(Product $product): JsonResponse
    {
        return response()->json([
            'product' => new ProductResource($product->load(['category', 'brand', 'images'])),
        ]);
    }

    public function update(UpdateProductRequest $request, Product $product): JsonResponse
    {
        $product->fill($request->validated())->save();

        return response()->json([
            'product' => new ProductResource($product->load(['category', 'brand', 'images'])),
        ]);
    }

    public function destroy(Product $product): JsonResponse
    {
        $product->delete();

        return response()->json(['ok' => true]);
    }
}
