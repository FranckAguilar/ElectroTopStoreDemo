<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Admin\UpdateQuoteAdminRequest;
use App\Http\Resources\V1\QuoteResource;
use App\Models\Quote;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class QuoteAdminController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Quote::query()
            ->with(['user', 'product'])
            ->orderByDesc('id');

        if ($request->filled('status')) {
            $query->where('status', (string) $request->query('status'));
        }

        if ($request->filled('product_id')) {
            $query->where('product_id', (int) $request->query('product_id'));
        }

        if ($request->filled('q')) {
            $q = (string) $request->query('q');
            $query->where(function ($qb) use ($q) {
                $qb->where('contact_name', 'like', "%{$q}%")
                    ->orWhere('contact_email', 'like', "%{$q}%");
            });
        }

        return QuoteResource::collection($query->paginate(20));
    }

    public function show(Quote $quote): JsonResponse
    {
        return response()->json([
            'quote' => new QuoteResource($quote->load(['user', 'product'])),
        ]);
    }

    public function update(UpdateQuoteAdminRequest $request, Quote $quote): JsonResponse
    {
        $quote->fill($request->validated())->save();

        return response()->json([
            'quote' => new QuoteResource($quote->load(['user', 'product'])),
        ]);
    }
}

