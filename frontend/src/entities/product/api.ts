import { apiRequest } from '@/shared/api/client'
import type { Product, ProductListResponse } from '@/entities/product/types'

const LIST_TTL_MS = 15_000
const listCache = new Map<string, { at: number; value: ProductListResponse }>()
const listInFlight = new Map<string, Promise<ProductListResponse>>()

export async function listProducts(
  params: { q?: string; category_id?: number; brand_id?: number; per_page?: number; page?: number } = {},
  options: { cache?: boolean } = {},
) {
  const cache = options.cache ?? true
  const query = new URLSearchParams()
  if (params.q) query.set('q', params.q)
  if (params.category_id) query.set('category_id', String(params.category_id))
  if (params.brand_id) query.set('brand_id', String(params.brand_id))
  if (params.per_page) query.set('per_page', String(params.per_page))
  if (params.page) query.set('page', String(params.page))

  const suffix = query.toString() ? `?${query.toString()}` : ''
  const key = `/products${suffix}`

  if (cache) {
    const hit = listCache.get(key)
    if (hit && Date.now() - hit.at < LIST_TTL_MS) return hit.value

    const inflight = listInFlight.get(key)
    if (inflight) return inflight
  }

  const request = apiRequest<ProductListResponse>(key)
  if (cache) listInFlight.set(key, request)

  try {
    const value = await request
    if (cache) listCache.set(key, { at: Date.now(), value })
    return value
  } finally {
    if (cache) listInFlight.delete(key)
  }
}

export async function getProduct(id: number) {
  return apiRequest<{ data: Product }>(`/products/${id}`)
}

export async function prefetchProductsList() {
  try {
    await listProducts({ per_page: 12, page: 1 }, { cache: true })
  } catch {
    // ignore
  }
}
