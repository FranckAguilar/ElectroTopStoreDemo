import { apiRequest } from '@/shared/api/client'
import type { Product } from '@/entities/product/types'

export type HomeProductsResponse = { data: Product[] }

const TTL_MS = 15_000
const cache = new Map<string, { at: number; value: HomeProductsResponse }>()
const inflight = new Map<string, Promise<HomeProductsResponse>>()

export async function getHomeRecommended(params: { limit?: number } = {}) {
  const q = new URLSearchParams()
  if (params.limit) q.set('limit', String(params.limit))
  const suffix = q.toString() ? `?${q.toString()}` : ''
  const key = `/home/recommended${suffix}`

  const hit = cache.get(key)
  if (hit && Date.now() - hit.at < TTL_MS) return hit.value

  const inFlightReq = inflight.get(key)
  if (inFlightReq) return inFlightReq

  const req = apiRequest<HomeProductsResponse>(key)
  inflight.set(key, req)
  try {
    const value = await req
    cache.set(key, { at: Date.now(), value })
    return value
  } finally {
    inflight.delete(key)
  }
}

export async function getHomeBestSellers(params: { days?: number; limit?: number } = {}) {
  const q = new URLSearchParams()
  if (params.days) q.set('days', String(params.days))
  if (params.limit) q.set('limit', String(params.limit))
  const suffix = q.toString() ? `?${q.toString()}` : ''
  const key = `/home/best-sellers${suffix}`

  const hit = cache.get(key)
  if (hit && Date.now() - hit.at < TTL_MS) return hit.value

  const inFlightReq = inflight.get(key)
  if (inFlightReq) return inFlightReq

  const req = apiRequest<HomeProductsResponse>(key)
  inflight.set(key, req)
  try {
    const value = await req
    cache.set(key, { at: Date.now(), value })
    return value
  } finally {
    inflight.delete(key)
  }
}
