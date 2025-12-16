<?php

namespace App\Services;

use App\Models\Brand;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class BrandLogoService
{
    public function setLogo(Brand $brand, UploadedFile $file): Brand
    {
        $ext = $file->getClientOriginalExtension() ?: 'jpg';
        $filename = Str::uuid()->toString().'.'.$ext;
        $path = $file->storePubliclyAs("brands/{$brand->id}", $filename, 'public');

        if ($brand->logo_path) {
            Storage::disk('public')->delete($brand->logo_path);
        }

        $brand->forceFill(['logo_path' => $path])->save();

        return $brand;
    }
}

