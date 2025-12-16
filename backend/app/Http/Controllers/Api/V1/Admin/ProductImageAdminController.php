<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Admin\ReorderProductImagesRequest;
use App\Http\Requests\Api\V1\Admin\StoreProductImageRequest;
use App\Http\Resources\V1\ProductImageResource;
use App\Models\Product;
use App\Models\ProductImage;
use App\Services\ProductImageService;
use Illuminate\Http\JsonResponse;

class ProductImageAdminController extends Controller
{
    public function __construct(private readonly ProductImageService $images)
    {
    }

    public function store(StoreProductImageRequest $request, Product $product): JsonResponse
    {
        $image = $this->images->addImage($product, $request->validated('image'));

        return response()->json([
            'image' => new ProductImageResource($image),
        ], 201);
    }

    public function destroy(ProductImage $image): JsonResponse
    {
        $this->images->deleteImage($image);

        return response()->json(['ok' => true]);
    }

    public function reorder(ReorderProductImagesRequest $request, Product $product): JsonResponse
    {
        $this->images->reorder($product, $request->validated('image_ids'));

        return response()->json([
            'images' => ProductImageResource::collection($product->images()->orderBy('order')->get()),
        ]);
    }

    public function setPrimary(ProductImage $image): JsonResponse
    {
        $this->images->setPrimary($image);

        return response()->json([
            'image' => new ProductImageResource($image->fresh()),
        ]);
    }
}
