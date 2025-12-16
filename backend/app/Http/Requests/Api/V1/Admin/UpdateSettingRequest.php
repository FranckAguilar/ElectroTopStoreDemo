<?php

namespace App\Http\Requests\Api\V1\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSettingRequest extends FormRequest
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
        $settingId = (int) $this->route('setting')?->id;

        return [
            'key' => ['sometimes', 'string', 'max:255', "unique:settings,key,{$settingId}"],
            'value' => ['sometimes', 'nullable', 'string'],
        ];
    }
}

