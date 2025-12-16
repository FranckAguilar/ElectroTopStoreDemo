<?php

namespace App\Enums;

enum OrderStatusName: string
{
    case Pending = 'pending';
    case Paid = 'paid';
    case Shipped = 'shipped';
    case Delivered = 'delivered';
    case Cancelled = 'cancelled';

    /**
     * @return array<int, string>
     */
    public static function values(): array
    {
        return array_map(fn (self $c) => $c->value, self::cases());
    }

    public function canTransitionTo(self $next): bool
    {
        return match ($this) {
            self::Pending => in_array($next, [self::Paid, self::Cancelled], true),
            self::Paid => in_array($next, [self::Shipped, self::Cancelled], true),
            self::Shipped => $next === self::Delivered,
            self::Delivered => false,
            self::Cancelled => false,
        };
    }
}

