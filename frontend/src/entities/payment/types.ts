import type { PaymentMethod } from '@/entities/paymentMethod/types'

export type Payment = {
  id: number
  order_id: number
  payment_method_id: number
  amount: string
  transaction_reference?: string | null
  proof_url?: string | null
  status: string
  paid_at?: string | null
  payment_method?: PaymentMethod | null
  created_at?: string | null
}

