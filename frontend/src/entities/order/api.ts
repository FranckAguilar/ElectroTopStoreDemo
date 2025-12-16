import { apiRequest } from '@/shared/api/client'
import type { Order, OrderListResponse } from '@/entities/order/types'

const LIST_TTL_MS = 15_000
const ORDER_TTL_MS = 15_000

const listCache = new Map<string, { at: number; value: OrderListResponse }>()
const listInFlight = new Map<string, Promise<OrderListResponse>>()

const orderCache = new Map<string, { at: number; value: { data: Order } }>()
const orderInFlight = new Map<string, Promise<{ data: Order }>>()

export async function listOrders(
  token: string,
  params: { page?: number } = {},
  options: { cache?: boolean } = {},
) {
  const cache = options.cache ?? true
  const query = new URLSearchParams()
  if (params.page) query.set('page', String(params.page))
  const suffix = query.toString() ? `?${query.toString()}` : ''
  const path = `/orders${suffix}`
  const key = `${token}|${path}`

  if (cache) {
    const hit = listCache.get(key)
    if (hit && Date.now() - hit.at < LIST_TTL_MS) return hit.value

    const inflight = listInFlight.get(key)
    if (inflight) return inflight
  }

  const req = apiRequest<OrderListResponse>(path, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (cache) listInFlight.set(key, req)
  try {
    const value = await req
    if (cache) listCache.set(key, { at: Date.now(), value })
    return value
  } finally {
    if (cache) listInFlight.delete(key)
  }
}

export async function getOrder(token: string, id: number, options: { cache?: boolean } = {}) {
  const cache = options.cache ?? true
  const path = `/orders/${id}`
  const key = `${token}|${path}`

  if (cache) {
    const hit = orderCache.get(key)
    if (hit && Date.now() - hit.at < ORDER_TTL_MS) return hit.value

    const inflight = orderInFlight.get(key)
    if (inflight) return inflight
  }

  const req = apiRequest<{ data: Order }>(path, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (cache) orderInFlight.set(key, req)
  try {
    const value = await req
    if (cache) orderCache.set(key, { at: Date.now(), value })
    return value
  } finally {
    if (cache) orderInFlight.delete(key)
  }
}

export async function prefetchOrders(token: string) {
  try {
    await listOrders(token, { page: 1 })
  } catch {
    // ignore
  }
}

export async function prefetchOrder(token: string, id: number) {
  try {
    await getOrder(token, id)
  } catch {
    // ignore
  }
}
