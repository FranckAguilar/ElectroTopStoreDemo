<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\V1\FaqResource;
use App\Models\Faq;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class FaqController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        return FaqResource::collection(
            Faq::query()->orderBy('order')->get()
        );
    }
}

