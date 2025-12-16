<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Admin\StoreFaqRequest;
use App\Http\Requests\Api\V1\Admin\UpdateFaqRequest;
use App\Http\Resources\V1\FaqResource;
use App\Models\Faq;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class FaqAdminController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        return FaqResource::collection(
            Faq::query()->orderBy('order')->paginate(20)
        );
    }

    public function store(StoreFaqRequest $request): JsonResponse
    {
        /** @var Faq $faq */
        $faq = Faq::query()->create($request->validated());

        return response()->json([
            'faq' => new FaqResource($faq),
        ], 201);
    }

    public function show(Faq $faq): JsonResponse
    {
        return response()->json([
            'faq' => new FaqResource($faq),
        ]);
    }

    public function update(UpdateFaqRequest $request, Faq $faq): JsonResponse
    {
        $faq->fill($request->validated())->save();

        return response()->json([
            'faq' => new FaqResource($faq),
        ]);
    }

    public function destroy(Faq $faq): JsonResponse
    {
        $faq->delete();

        return response()->json(['ok' => true]);
    }
}

