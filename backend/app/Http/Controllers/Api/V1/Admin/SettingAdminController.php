<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Admin\StoreSettingRequest;
use App\Http\Requests\Api\V1\Admin\UpdateSettingRequest;
use App\Http\Resources\V1\SettingResource;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class SettingAdminController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        return SettingResource::collection(
            Setting::query()->orderBy('key')->paginate(30)
        );
    }

    public function store(StoreSettingRequest $request): JsonResponse
    {
        /** @var Setting $setting */
        $setting = Setting::query()->create($request->validated());

        return response()->json([
            'setting' => new SettingResource($setting),
        ], 201);
    }

    public function show(Setting $setting): JsonResponse
    {
        return response()->json([
            'setting' => new SettingResource($setting),
        ]);
    }

    public function update(UpdateSettingRequest $request, Setting $setting): JsonResponse
    {
        $setting->fill($request->validated())->save();

        return response()->json([
            'setting' => new SettingResource($setting),
        ]);
    }

    public function destroy(Setting $setting): JsonResponse
    {
        $setting->delete();

        return response()->json(['ok' => true]);
    }
}

