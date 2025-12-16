<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Admin\StoreBrandLogoRequest;
use App\Http\Resources\V1\BrandResource;
use App\Models\Brand;
use App\Services\BrandLogoService;
use Illuminate\Http\JsonResponse;

class BrandLogoAdminController extends Controller
{
    public function __construct(private readonly BrandLogoService $logos)
    {
    }

    public function store(StoreBrandLogoRequest $request, Brand $brand): JsonResponse
    {
        $brand = $this->logos->setLogo($brand, $request->validated('logo'));

        return response()->json([
            'brand' => new BrandResource($brand),
        ]);
    }
}

