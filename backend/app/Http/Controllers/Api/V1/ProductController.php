<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\V1\ProductResource;
use App\Models\Product;
use App\Services\ProductService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ProductController extends Controller
{
    public function __construct(private readonly ProductService $products)
    {
    }

    public function index(Request $request): AnonymousResourceCollection
    {
        $paginator = $this->products->list([
            ...$request->query(),
            'per_page' => (int) ($request->query('per_page', 12)),
            'sort_by' => (string) $request->query('sort_by', 'id'),
            'sort_dir' => (string) $request->query('sort_dir', 'asc'),
        ]);

        return ProductResource::collection($paginator);
    }

    public function show(Product $product): ProductResource
    {
        return new ProductResource($product->load(['category', 'brand', 'images']));
    }
}
