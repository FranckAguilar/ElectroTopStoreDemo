<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Admin\UpdateHomeAdminRequest;
use App\Http\Resources\V1\ProductResource;
use App\Services\HomeService;
use Illuminate\Http\JsonResponse;

class HomeAdminController extends Controller
{
    public function __construct(private readonly HomeService $home)
    {
    }

    public function show(): JsonResponse
    {
        $recommendedIds = $this->home->recommendedProductIds();

        return response()->json([
            'recommended_product_ids' => $recommendedIds,
            'recommended_products' => ProductResource::collection(
                $this->home->recommendedProductsFromIds($recommendedIds)
            ),
            'best_sellers_days' => $this->home->bestSellersDays(),
            'best_sellers_limit' => $this->home->bestSellersLimit(),
        ]);
    }

    public function update(UpdateHomeAdminRequest $request): JsonResponse
    {
        /** @var array<int, int>|null $ids */
        $ids = $request->validated('recommended_product_ids');

        if (is_array($ids)) {
            $this->home->setRecommendedProductIds($ids);
        }

        $days = $request->validated('best_sellers_days');
        $limit = $request->validated('best_sellers_limit');

        $this->home->setBestSellersConfig(
            is_numeric($days) ? (int) $days : null,
            is_numeric($limit) ? (int) $limit : null,
        );

        return $this->show();
    }
}
