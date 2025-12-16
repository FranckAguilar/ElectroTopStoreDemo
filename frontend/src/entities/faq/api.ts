import { apiRequest } from '@/shared/api/client'
import type { FaqListResponse } from '@/entities/faq/types'

const TTL_MS = 60_000
let cached: { at: number; value: FaqListResponse } | null = null
let inFlight: Promise<FaqListResponse> | null = null

export async function listFaqs(options: { forceRefresh?: boolean } = {}) {
  const forceRefresh = options.forceRefresh ?? false

  if (!forceRefresh && cached && Date.now() - cached.at < TTL_MS) return cached.value
  if (!forceRefresh && inFlight) return inFlight

  inFlight = apiRequest<FaqListResponse>('/faqs')
  try {
    const value = await inFlight
    cached = { at: Date.now(), value }
    return value
  } finally {
    inFlight = null
  }
}

export async function prefetchFaqs() {
  try {
    await listFaqs()
  } catch {
    // ignore
  }
}
