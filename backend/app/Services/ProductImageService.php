<?php

namespace App\Services;

use App\Models\Product;
use App\Models\ProductImage;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ProductImageService
{
    public function addImage(Product $product, UploadedFile $file): ProductImage
    {
        $ext = $file->getClientOriginalExtension() ?: 'jpg';
        $filename = Str::uuid()->toString().'.'.$ext;
        $path = $file->storePubliclyAs("products/{$product->id}", $filename, 'public');

        $nextOrder = (int) ($product->images()->max('order') ?? 0) + 1;

        /** @var ProductImage $image */
        $image = $product->images()->create([
            'image_path' => $path,
            'order' => $nextOrder,
        ]);

        return $image;
    }

    public function deleteImage(ProductImage $image): void
    {
        if ($image->image_path) {
            Storage::disk('public')->delete($image->image_path);
        }

        $image->delete();
    }

    /**
     * @param  array<int, int>  $imageIds
     */
    public function reorder(Product $product, array $imageIds): void
    {
        $existingIds = $product->images()->pluck('id')->all();

        sort($existingIds);
        $normalized = array_values(array_unique(array_map('intval', $imageIds)));
        sort($normalized);

        if ($existingIds !== $normalized) {
            abort(422, 'image_ids must contain all existing product image ids exactly once.');
        }

        foreach (array_values($imageIds) as $index => $id) {
            $product->images()->where('id', $id)->update(['order' => $index]);
        }
    }

    public function setPrimary(ProductImage $image): void
    {
        $product = $image->product()->first();

        if (! $product) {
            abort(422, 'Image has no product.');
        }

        $product->images()->where('id', '!=', $image->id)->increment('order');
        $image->forceFill(['order' => 0])->save();
    }
}
