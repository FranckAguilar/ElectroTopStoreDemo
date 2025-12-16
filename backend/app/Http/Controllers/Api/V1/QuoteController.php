<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\StoreQuoteRequest;
use App\Http\Resources\V1\QuoteResource;
use App\Models\Quote;
use Illuminate\Http\JsonResponse;

class QuoteController extends Controller
{
    public function store(StoreQuoteRequest $request): JsonResponse
    {
        $user = auth('api')->user();

        /** @var Quote $quote */
        $quote = Quote::query()->create([
            'user_id' => $user?->id,
            ...$request->validated(),
        ]);

        return response()->json([
            'quote' => new QuoteResource($quote->load('product')),
        ], 201);
    }
}

