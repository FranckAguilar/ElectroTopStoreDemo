import { apiRequest } from '@/shared/api/client'

export type QuotePayload = {
  contact_name: string
  contact_email: string
  contact_phone?: string
  product_id: number
  quantity?: number
  message?: string
}

export async function submitQuote(payload: QuotePayload) {
  return apiRequest<{ data: unknown }>('/quotes', { method: 'POST', body: payload })
}

