<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\V1\ProductResource;
use App\Services\HomeService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class HomeController extends Controller
{
    public function __construct(private readonly HomeService $home)
    {
    }

    public function recommended(Request $request): AnonymousResourceCollection
    {
        $limit = (int) ($request->query('limit') ?? 12);

        return ProductResource::collection(
            $this->home->recommendedProducts($limit)
        );
    }

    public function bestSellers(Request $request): AnonymousResourceCollection
    {
        $days = $request->query('days');
        $limit = $request->query('limit');

        $daysInt = is_numeric($days) ? (int) $days : null;
        $limitInt = is_numeric($limit) ? (int) $limit : null;

        return ProductResource::collection(
            $this->home->bestSellersProducts($daysInt, $limitInt)
        );
    }
}

