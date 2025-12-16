<?php

namespace App\Services;

use App\Enums\OrderStatusName;
use App\Enums\PaymentStatus;
use App\Models\Order;
use App\Models\OrderStatus;
use App\Models\Payment;

class WorkflowService
{
    public function ensureOrderStatusId(OrderStatusName $status): int
    {
        return OrderStatus::query()->firstOrCreate(['name' => $status->value])->id;
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function applyOrderAdminUpdate(Order $order, array $data): Order
    {
        if (array_key_exists('order_status', $data)) {
            $target = OrderStatusName::from((string) $data['order_status']);
            $data['order_status_id'] = $this->ensureOrderStatusId($target);
            unset($data['order_status']);
        }

        if (array_key_exists('order_status_id', $data)) {
            $currentName = (string) ($order->status?->name ?? '');
            $nextName = (string) (OrderStatus::query()->whereKey($data['order_status_id'])->value('name') ?? '');

            if (! in_array($currentName, OrderStatusName::values(), true) || ! in_array($nextName, OrderStatusName::values(), true)) {
                abort(422, 'Invalid order status.');
            }

            $current = OrderStatusName::from($currentName);
            $next = OrderStatusName::from($nextName);

            if ($current !== $next && ! $current->canTransitionTo($next)) {
                abort(422, "Order status transition not allowed: {$current->value} -> {$next->value}.");
            }
        }

        $order->fill($data)->save();

        return $order;
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function applyPaymentAdminUpdate(Payment $payment, array $data): Payment
    {
        if (array_key_exists('status', $data)) {
            $current = PaymentStatus::from((string) $payment->status);
            $next = PaymentStatus::from((string) $data['status']);

            if ($current !== $next && ! $current->canTransitionTo($next)) {
                abort(422, "Payment status transition not allowed: {$current->value} -> {$next->value}.");
            }

            $orderStatusName = $payment->order?->status?->name;
            if ($next === PaymentStatus::Paid && $orderStatusName === OrderStatusName::Cancelled->value) {
                abort(422, 'Cannot mark payment as paid for a cancelled order.');
            }

            if ($next === PaymentStatus::Paid && empty($data['paid_at']) && empty($payment->paid_at)) {
                $data['paid_at'] = now();
            }

            if ($next === PaymentStatus::Paid && $payment->order) {
                $order = $payment->order->loadMissing('status');

                if (($order->status?->name ?? null) === OrderStatusName::Pending->value) {
                    $order->order_status_id = $this->ensureOrderStatusId(OrderStatusName::Paid);
                    $order->save();
                }
            }
        }

        $payment->fill($data)->save();

        return $payment;
    }
}

