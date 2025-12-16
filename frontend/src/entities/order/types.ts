import type { Product } from '@/entities/product/types'
import type { Payment } from '@/entities/payment/types'

export type OrderItem = {
  id: number
  quantity: number
  unit_price: string
  subtotal: string
  product?: Product
}

export type Order = {
  id: number
  total_amount: string
  status?: string
  user?: { id: number; name: string; email: string } | null
  payment_method_id: number
  shipping_address?: string | null
  placed_at?: string | null
  created_at?: string | null
  items?: OrderItem[]
  payments?: Payment[]
}

export type OrderListResponse = {
  data: Order[]
  links?: { first?: string; last?: string; prev?: string | null; next?: string | null }
  meta?: { current_page: number; last_page: number; per_page: number; total: number }
}
