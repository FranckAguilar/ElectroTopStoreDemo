<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Admin\StoreBrandRequest;
use App\Http\Requests\Api\V1\Admin\UpdateBrandRequest;
use App\Http\Resources\V1\BrandResource;
use App\Models\Brand;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class BrandAdminController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        return BrandResource::collection(
            Brand::query()->orderBy('id')->paginate(20)
        );
    }

    public function store(StoreBrandRequest $request): JsonResponse
    {
        /** @var Brand $brand */
        $brand = Brand::query()->create($request->validated());

        return response()->json([
            'brand' => new BrandResource($brand),
        ], 201);
    }

    public function show(Brand $brand): JsonResponse
    {
        return response()->json([
            'brand' => new BrandResource($brand),
        ]);
    }

    public function update(UpdateBrandRequest $request, Brand $brand): JsonResponse
    {
        $brand->fill($request->validated())->save();

        return response()->json([
            'brand' => new BrandResource($brand),
        ]);
    }

    public function destroy(Brand $brand): JsonResponse
    {
        $brand->delete();

        return response()->json(['ok' => true]);
    }
}
