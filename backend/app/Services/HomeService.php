<?php

namespace App\Services;

use App\Models\OrderStatus;
use App\Models\Product;
use App\Models\Setting;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class HomeService
{
    private const RECOMMENDED_IDS_KEY = 'home.recommended_product_ids';

    private const BEST_SELLERS_DAYS_KEY = 'home.best_sellers_days';

    private const BEST_SELLERS_LIMIT_KEY = 'home.best_sellers_limit';

    /**
     * @return array<int, int>
     */
    public function recommendedProductIds(): array
    {
        $value = Setting::query()->where('key', self::RECOMMENDED_IDS_KEY)->value('value');

        if (! is_string($value) || $value === '') {
            return [];
        }

        $decoded = json_decode($value, true);

        if (! is_array($decoded)) {
            return [];
        }

        $ids = [];
        foreach ($decoded as $id) {
            $int = filter_var($id, FILTER_VALIDATE_INT);
            if ($int === false) {
                continue;
            }
            $ids[] = (int) $int;
        }

        return array_values(array_unique($ids));
    }

    /**
     * @param  array<int, int>  $ids
     */
    public function setRecommendedProductIds(array $ids): void
    {
        $normalized = array_values(array_unique(array_map('intval', $ids)));

        if (count($normalized) > 0) {
            $active = Product::query()
                ->whereIn('id', $normalized)
                ->where('status', 'active')
                ->pluck('id')
                ->map(fn ($id) => (int) $id)
                ->all();

            $activeSet = array_fill_keys($active, true);
            $normalized = array_values(array_filter($normalized, fn (int $id) => isset($activeSet[$id])));
        }

        Setting::query()->updateOrCreate(
            ['key' => self::RECOMMENDED_IDS_KEY],
            ['value' => json_encode($normalized)],
        );
    }

    public function bestSellersDays(): int
    {
        $value = Setting::query()->where('key', self::BEST_SELLERS_DAYS_KEY)->value('value');

        $days = is_string($value) ? (int) $value : 30;

        return max(1, min(365, $days));
    }

    public function bestSellersLimit(): int
    {
        $value = Setting::query()->where('key', self::BEST_SELLERS_LIMIT_KEY)->value('value');

        $limit = is_string($value) ? (int) $value : 12;

        return max(1, min(50, $limit));
    }

    public function setBestSellersConfig(?int $days, ?int $limit): void
    {
        if ($days !== null) {
            Setting::query()->updateOrCreate(
                ['key' => self::BEST_SELLERS_DAYS_KEY],
                ['value' => (string) max(1, min(365, $days))],
            );
        }

        if ($limit !== null) {
            Setting::query()->updateOrCreate(
                ['key' => self::BEST_SELLERS_LIMIT_KEY],
                ['value' => (string) max(1, min(50, $limit))],
            );
        }
    }

    /**
     * @return Collection<int, Product>
     */
    public function recommendedProducts(int $limit = 12): Collection
    {
        $limit = max(1, min(50, $limit));
        $ids = $this->recommendedProductIds();

        if (count($ids) === 0) {
            return Product::query()
                ->with(['category', 'brand', 'images'])
                ->where('status', 'active')
                ->inRandomOrder()
                ->limit($limit)
                ->get();
        }

        return $this->recommendedProductsFromIds(array_slice($ids, 0, $limit));
    }

    /**
     * @param  array<int, int>  $ids
     * @return Collection<int, Product>
     */
    public function recommendedProductsFromIds(array $ids): Collection
    {
        $ids = array_values(array_unique(array_map('intval', $ids)));

        if (count($ids) === 0) {
            return new Collection();
        }

        $query = Product::query()
            ->with(['category', 'brand', 'images'])
            ->where('status', 'active')
            ->whereIn('id', $ids);

        $idsSql = implode(',', array_map('intval', $ids));

        return $query
            ->orderByRaw("array_position(ARRAY[{$idsSql}]::bigint[], id)")
            ->get();
    }

    /**
     * @return Collection<int, Product>
     */
    public function bestSellersProducts(?int $days = null, ?int $limit = null): Collection
    {
        $days = $days !== null ? max(1, min(365, $days)) : $this->bestSellersDays();
        $limit = $limit !== null ? max(1, min(50, $limit)) : $this->bestSellersLimit();

        $paidIds = OrderStatus::query()
            ->whereIn('name', ['paid', 'shipped', 'delivered'])
            ->pluck('id')
            ->all();

        if (count($paidIds) === 0) {
            return new Collection();
        }

        $since = now()->subDays($days);

        $rows = DB::table('order_items')
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->whereIn('orders.order_status_id', $paidIds)
            ->where('orders.placed_at', '>=', $since)
            ->select('order_items.product_id', DB::raw('SUM(order_items.quantity) as sold_qty'))
            ->groupBy('order_items.product_id')
            ->orderByDesc('sold_qty')
            ->orderBy('order_items.product_id')
            ->limit($limit)
            ->get();

        $ids = $rows->pluck('product_id')->map(fn ($id) => (int) $id)->all();

        if (count($ids) === 0) {
            return new Collection();
        }

        $idsSql = implode(',', array_map('intval', $ids));

        return Product::query()
            ->with(['category', 'brand', 'images'])
            ->where('status', 'active')
            ->whereIn('id', $ids)
            ->orderByRaw("array_position(ARRAY[{$idsSql}]::bigint[], id)")
            ->get();
    }
}
