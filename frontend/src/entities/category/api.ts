import { apiRequest } from '@/shared/api/client'
import type { CategoryListResponse } from '@/entities/category/types'

const TTL_MS = 60_000
let cached: { at: number; value: CategoryListResponse } | null = null
let inFlight: Promise<CategoryListResponse> | null = null

export async function listCategories(options: { forceRefresh?: boolean } = {}) {
  const forceRefresh = options.forceRefresh ?? false

  if (!forceRefresh && cached && Date.now() - cached.at < TTL_MS) return cached.value
  if (!forceRefresh && inFlight) return inFlight

  inFlight = apiRequest<CategoryListResponse>('/categories')
  try {
    const value = await inFlight
    cached = { at: Date.now(), value }
    return value
  } finally {
    inFlight = null
  }
}

export async function prefetchCategories() {
  try {
    await listCategories()
  } catch {
    // ignore
  }
}
