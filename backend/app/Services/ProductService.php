<?php

namespace App\Services;

use App\Models\Product;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class ProductService
{
    /**
     * @param  array{q?:string,category_id?:int,brand_id?:int,status?:string,min_price?:numeric,max_price?:numeric,per_page?:int,sort_by?:string,sort_dir?:string}  $filters
     */
    public function list(array $filters): LengthAwarePaginator
    {
        $query = Product::query()->with(['category', 'brand', 'images']);

        $sortBy = isset($filters['sort_by']) ? (string) $filters['sort_by'] : null;
        $sortDir = isset($filters['sort_dir']) ? strtolower((string) $filters['sort_dir']) : null;

        $allowedSorts = [
            'id' => 'id',
            'name' => 'name',
            'codigo' => 'codigo',
            'price' => 'price',
            'stock_quantity' => 'stock_quantity',
            'status' => 'status',
            'created_at' => 'created_at',
        ];

        if ($sortBy && isset($allowedSorts[$sortBy])) {
            $dir = $sortDir === 'asc' ? 'asc' : 'desc';
            $query->orderBy($allowedSorts[$sortBy], $dir);
        } else {
            $query->orderByDesc('id');
        }

        if (! empty($filters['q'])) {
            $q = (string) $filters['q'];

            $query->where(function ($qBuilder) use ($q) {
                $qBuilder
                    ->where('name', 'like', "%{$q}%")
                    ->orWhere('codigo', 'like', "%{$q}%");
            });
        }

        if (! empty($filters['category_id'])) {
            $query->where('category_id', (int) $filters['category_id']);
        }

        if (! empty($filters['brand_id'])) {
            $query->where('brand_id', (int) $filters['brand_id']);
        }

        if (! empty($filters['status'])) {
            $query->where('status', (string) $filters['status']);
        }

        if (isset($filters['min_price'])) {
            $query->where('price', '>=', $filters['min_price']);
        }

        if (isset($filters['max_price'])) {
            $query->where('price', '<=', $filters['max_price']);
        }

        $perPage = isset($filters['per_page']) ? max(1, (int) $filters['per_page']) : 12;

        return $query->paginate($perPage);
    }
}
