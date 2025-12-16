<?php

namespace Tests\Unit;

use App\Enums\OrderStatusName;
use App\Enums\PaymentStatus;
use PHPUnit\Framework\TestCase;

class StatusTransitionTest extends TestCase
{
    public function test_order_status_transitions(): void
    {
        $this->assertTrue(OrderStatusName::Pending->canTransitionTo(OrderStatusName::Paid));
        $this->assertTrue(OrderStatusName::Pending->canTransitionTo(OrderStatusName::Cancelled));
        $this->assertFalse(OrderStatusName::Pending->canTransitionTo(OrderStatusName::Delivered));

        $this->assertTrue(OrderStatusName::Paid->canTransitionTo(OrderStatusName::Shipped));
        $this->assertTrue(OrderStatusName::Paid->canTransitionTo(OrderStatusName::Cancelled));
        $this->assertFalse(OrderStatusName::Paid->canTransitionTo(OrderStatusName::Pending));

        $this->assertTrue(OrderStatusName::Shipped->canTransitionTo(OrderStatusName::Delivered));
        $this->assertFalse(OrderStatusName::Shipped->canTransitionTo(OrderStatusName::Cancelled));

        $this->assertFalse(OrderStatusName::Delivered->canTransitionTo(OrderStatusName::Cancelled));
        $this->assertFalse(OrderStatusName::Cancelled->canTransitionTo(OrderStatusName::Paid));
    }

    public function test_payment_status_transitions(): void
    {
        $this->assertTrue(PaymentStatus::Pending->canTransitionTo(PaymentStatus::Paid));
        $this->assertTrue(PaymentStatus::Pending->canTransitionTo(PaymentStatus::Failed));
        $this->assertTrue(PaymentStatus::Pending->canTransitionTo(PaymentStatus::Cancelled));

        $this->assertTrue(PaymentStatus::Failed->canTransitionTo(PaymentStatus::Paid));
        $this->assertTrue(PaymentStatus::Failed->canTransitionTo(PaymentStatus::Cancelled));
        $this->assertFalse(PaymentStatus::Failed->canTransitionTo(PaymentStatus::Pending));

        $this->assertFalse(PaymentStatus::Paid->canTransitionTo(PaymentStatus::Failed));
        $this->assertFalse(PaymentStatus::Cancelled->canTransitionTo(PaymentStatus::Paid));
    }
}

