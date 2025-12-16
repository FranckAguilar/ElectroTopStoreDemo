<?php

namespace App\Http\Requests\Api\V1\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateHomeAdminRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'recommended_product_ids' => ['sometimes', 'array', 'max:50'],
            'recommended_product_ids.*' => ['integer', 'distinct', 'exists:products,id'],
            'best_sellers_days' => ['sometimes', 'integer', 'min:1', 'max:365'],
            'best_sellers_limit' => ['sometimes', 'integer', 'min:1', 'max:50'],
        ];
    }
}

