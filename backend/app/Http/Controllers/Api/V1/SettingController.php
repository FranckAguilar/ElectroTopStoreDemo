<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $keys = $request->query('keys');

        $query = Setting::query();

        if (is_array($keys) && count($keys) > 0) {
            $query->whereIn('key', $keys);
        }

        return response()->json([
            'settings' => $query->pluck('value', 'key'),
        ]);
    }
}

