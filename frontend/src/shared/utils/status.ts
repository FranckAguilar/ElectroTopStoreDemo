export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled'
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'cancelled'

export const orderStatusLabels: Record<OrderStatus, string> = {
  pending: 'Pendiente',
  paid: 'Procesando',
  shipped: 'Enviado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
}

export const paymentStatusLabels: Record<PaymentStatus, string> = {
  pending: 'Pendiente',
  paid: 'Pagado',
  failed: 'Fallido',
  cancelled: 'Cancelado',
}

export function nextOrderStatuses(current: OrderStatus): OrderStatus[] {
  switch (current) {
    case 'pending':
      return ['paid', 'cancelled']
    case 'paid':
      return ['shipped', 'cancelled']
    case 'shipped':
      return ['delivered']
    case 'delivered':
    case 'cancelled':
      return []
  }
}

export function nextPaymentStatuses(current: PaymentStatus): PaymentStatus[] {
  switch (current) {
    case 'pending':
      return ['paid', 'failed', 'cancelled']
    case 'failed':
      return ['paid', 'cancelled']
    case 'paid':
    case 'cancelled':
      return []
  }
}

