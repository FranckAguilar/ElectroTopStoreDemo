<?php

namespace App\Http\Requests\Api\V1\Admin;

use App\Enums\OrderStatusName;
use App\Models\OrderStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateOrderAdminRequest extends FormRequest
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
            'order_status_id' => ['sometimes', 'integer', 'exists:order_statuses,id'],
            'order_status' => ['sometimes', 'string', Rule::in(OrderStatusName::values())],
            'payment_method_id' => ['sometimes', 'nullable', 'integer', 'exists:payment_methods,id'],
            'shipping_address' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'placed_at' => ['sometimes', 'nullable', 'date'],
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('order_status_id') && ! $this->has('order_status')) {
            $name = OrderStatus::query()->whereKey($this->input('order_status_id'))->value('name');

            if (is_string($name)) {
                $this->merge(['order_status' => $name]);
            }
        }
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            if (! $this->has('order_status_id') || ! $this->has('order_status')) {
                return;
            }

            $name = OrderStatus::query()->whereKey($this->input('order_status_id'))->value('name');

            if (is_string($name) && $name !== $this->input('order_status')) {
                $validator->errors()->add('order_status', 'order_status does not match order_status_id.');
            }
        });
    }
}
