import { apiRequest } from '@/shared/api/client'
import type { PaymentMethodListResponse } from '@/entities/paymentMethod/types'

const TTL_MS = 60_000
let cached: { at: number; value: PaymentMethodListResponse } | null = null
let inFlight: Promise<PaymentMethodListResponse> | null = null

export async function listPaymentMethods(options: { forceRefresh?: boolean } = {}) {
  const forceRefresh = options.forceRefresh ?? false

  if (!forceRefresh && cached && Date.now() - cached.at < TTL_MS) return cached.value
  if (!forceRefresh && inFlight) return inFlight

  inFlight = apiRequest<PaymentMethodListResponse>('/payment-methods')
  try {
    const value = await inFlight
    cached = { at: Date.now(), value }
    return value
  } finally {
    inFlight = null
  }
}

export async function prefetchPaymentMethods() {
  try {
    await listPaymentMethods()
  } catch {
    // ignore
  }
}
