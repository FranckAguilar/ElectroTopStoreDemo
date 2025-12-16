import { apiRequest } from '@/shared/api/client'
import type { BrandListResponse } from '@/entities/brand/types'

const TTL_MS = 60_000
let cached: { at: number; value: BrandListResponse } | null = null
let inFlight: Promise<BrandListResponse> | null = null

export async function listBrands(options: { forceRefresh?: boolean } = {}) {
  const forceRefresh = options.forceRefresh ?? false

  if (!forceRefresh && cached && Date.now() - cached.at < TTL_MS) return cached.value
  if (!forceRefresh && inFlight) return inFlight

  inFlight = apiRequest<BrandListResponse>('/brands')
  try {
    const value = await inFlight
    cached = { at: Date.now(), value }
    return value
  } finally {
    inFlight = null
  }
}

export async function prefetchBrands() {
  try {
    await listBrands()
  } catch {
    // ignore
  }
}
