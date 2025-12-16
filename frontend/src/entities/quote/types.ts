import type { Product } from '@/entities/product/types'

export type Quote = {
  id: number
  user_id?: number | null
  contact_name: string
  contact_email: string
  contact_phone?: string | null
  quantity: number
  message?: string | null
  status: string
  product?: Product
  user?: { id: number; name: string; email: string } | null
  created_at?: string | null
}

export type QuoteListResponse = {
  data: Quote[]
  links?: { first?: string; last?: string; prev?: string | null; next?: string | null }
  meta?: { current_page: number; last_page: number; per_page: number; total: number }
}

