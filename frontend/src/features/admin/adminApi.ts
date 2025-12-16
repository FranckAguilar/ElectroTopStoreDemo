import { apiRequest, apiUpload } from '@/shared/api/client'
import type { JsonValue } from '@/shared/api/client'
import type { Order } from '@/entities/order/types'
import type { Category } from '@/entities/category/types'
import type { Brand } from '@/entities/brand/types'
import type { PaymentMethod } from '@/entities/paymentMethod/types'
import type { Faq } from '@/entities/faq/types'
import type { Setting } from '@/entities/setting/types'
import type { Product, ProductImage } from '@/entities/product/types'
import type { Role } from '@/entities/role/types'
import type { User } from '@/entities/user/types'
import type { Quote } from '@/entities/quote/types'

export type PageMeta = { current_page: number; last_page: number; per_page: number; total: number }
export type PaginatedResponse<T> = {
  data: T[]
  links?: { first?: string; last?: string; prev?: string | null; next?: string | null }
  meta?: PageMeta
}

export type AdminPayment = {
  id: number
  order_id: number
  amount: string
  status: string
  transaction_reference?: string | null
  proof_url?: string | null
  payment_method?: { id: number; name: string } | null
  order?: { id: number; total_amount: string; user?: { id: number; name: string; email: string } | null } | null
  created_at?: string | null
}

export type AdminPaymentListResponse = PaginatedResponse<AdminPayment>

export type AdminProduct = Product & {
  category?: Category | null
  brand?: Brand | null
  images?: ProductImage[]
}

export type AdminProductListResponse = PaginatedResponse<AdminProduct>
export type AdminOrderListResponse = PaginatedResponse<Order>
export type AdminCategoryListResponse = PaginatedResponse<Category>
export type AdminBrandListResponse = PaginatedResponse<Brand>
export type AdminPaymentMethodListResponse = PaginatedResponse<PaymentMethod>
export type AdminFaqListResponse = PaginatedResponse<Faq>
export type AdminSettingListResponse = PaginatedResponse<Setting>
export type AdminUserListResponse = PaginatedResponse<User>
export type AdminQuoteListResponse = PaginatedResponse<Quote>

export type AdminHomeConfig = {
  recommended_product_ids: number[]
  recommended_products: { data: AdminProduct[] }
  best_sellers_days: number
  best_sellers_limit: number
}

export type AdminDashboardResponse = {
  stats: { products: number; orders: number; payments: number }
  recent_orders: Array<{
    id: number
    total_amount: string
    status: string | null
    placed_at: string | null
    user: { id: number; name: string; email: string } | null
  }>
}

function auth(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` }
}

export async function adminGetDashboard(token: string) {
  const ADMIN_DASHBOARD_TTL_MS = 10_000
  const caches =
    (adminGetDashboard as unknown as {
      __cache?: Map<string, { at: number; value: AdminDashboardResponse }>
      __inFlight?: Map<string, Promise<AdminDashboardResponse>>
    })

  if (!caches.__cache) caches.__cache = new Map()
  if (!caches.__inFlight) caches.__inFlight = new Map()

  const key = token
  const hit = caches.__cache.get(key)
  if (hit && Date.now() - hit.at < ADMIN_DASHBOARD_TTL_MS) return hit.value

  const inflight = caches.__inFlight.get(key)
  if (inflight) return inflight

  const req = apiRequest<AdminDashboardResponse>(`/admin/dashboard`, { headers: auth(token) })
  caches.__inFlight.set(key, req)

  try {
    const value = await req
    caches.__cache.set(key, { at: Date.now(), value })
    return value
  } finally {
    caches.__inFlight.delete(key)
  }
}

export async function prefetchAdminDashboard(token: string) {
  try {
    await adminGetDashboard(token)
  } catch {
    // ignore
  }
}

export async function adminGetHomeConfig(token: string) {
  return apiRequest<AdminHomeConfig>(`/admin/home`, { headers: auth(token) })
}

export async function adminUpdateHomeConfig(
  token: string,
  payload: { recommended_product_ids?: number[]; best_sellers_days?: number; best_sellers_limit?: number },
) {
  return apiRequest<AdminHomeConfig>(`/admin/home`, {
    method: 'PUT',
    headers: auth(token),
    body: payload as unknown as JsonValue,
  })
}

export async function adminListOrders(token: string, params: { page?: number } = {}) {
  const q = new URLSearchParams()
  if (params.page) q.set('page', String(params.page))
  const suffix = q.toString() ? `?${q.toString()}` : ''
  return apiRequest<AdminOrderListResponse>(`/admin/orders${suffix}`, { headers: auth(token) })
}

export async function adminUpdateOrder(token: string, orderId: number, payload: { order_status: string }) {
  return apiRequest<{ data: unknown }>(`/admin/orders/${orderId}`, {
    method: 'PATCH',
    headers: auth(token),
    body: payload,
  })
}

export async function adminListPayments(token: string, params: { page?: number; order_id?: number; status?: string } = {}) {
  const q = new URLSearchParams()
  if (params.page) q.set('page', String(params.page))
  if (params.order_id) q.set('order_id', String(params.order_id))
  if (params.status) q.set('status', String(params.status))
  const suffix = q.toString() ? `?${q.toString()}` : ''
  const path = `/admin/payments${suffix}`

  const ADMIN_PAYMENTS_TTL_MS = 15_000
  const caches =
    (adminListPayments as unknown as {
      __cache?: Map<string, { at: number; value: AdminPaymentListResponse }>
      __inFlight?: Map<string, Promise<AdminPaymentListResponse>>
    })

  if (!caches.__cache) caches.__cache = new Map()
  if (!caches.__inFlight) caches.__inFlight = new Map()

  const key = `${token}|${path}`
  const hit = caches.__cache.get(key)
  if (hit && Date.now() - hit.at < ADMIN_PAYMENTS_TTL_MS) return hit.value

  const inflight = caches.__inFlight.get(key)
  if (inflight) return inflight

  const req = apiRequest<AdminPaymentListResponse>(path, { headers: auth(token) })
  caches.__inFlight.set(key, req)

  try {
    const value = await req
    caches.__cache.set(key, { at: Date.now(), value })
    return value
  } finally {
    caches.__inFlight.delete(key)
  }
}

export async function adminUpdatePayment(token: string, paymentId: number, payload: { status: string }) {
  const res = await apiRequest<{ data: unknown }>(`/admin/payments/${paymentId}`, {
    method: 'PATCH',
    headers: auth(token),
    body: payload,
  })

  invalidateAdminPaymentsCache()
  return res
}

export async function adminGetPayment(token: string, paymentId: number) {
  return apiRequest<{ payment: AdminPayment }>(`/admin/payments/${paymentId}`, { headers: auth(token) })
}

export async function prefetchAdminPayments(token: string) {
  try {
    await adminListPayments(token, { page: 1 })
  } catch {
    // ignore
  }
}

function invalidateAdminPaymentsCache() {
  const caches =
    (adminListPayments as unknown as {
      __cache?: Map<string, { at: number; value: AdminPaymentListResponse }>
      __inFlight?: Map<string, Promise<AdminPaymentListResponse>>
    })

  caches.__cache?.clear()
  caches.__inFlight?.clear()
}

export async function adminGetOrder(token: string, orderId: number) {
  return apiRequest<{ order: Order }>(`/admin/orders/${orderId}`, { headers: auth(token) })
}

export async function adminListRoles(token: string) {
  const ADMIN_ROLES_TTL_MS = 60_000
  const caches =
    (adminListRoles as unknown as {
      __cache?: Map<string, { at: number; value: { data: Role[] } }>
      __inFlight?: Map<string, Promise<{ data: Role[] }>>
    })

  if (!caches.__cache) caches.__cache = new Map()
  if (!caches.__inFlight) caches.__inFlight = new Map()

  const key = token
  const hit = caches.__cache.get(key)
  if (hit && Date.now() - hit.at < ADMIN_ROLES_TTL_MS) return hit.value

  const inflight = caches.__inFlight.get(key)
  if (inflight) return inflight

  const req = apiRequest<{ data: Role[] }>(`/admin/roles`, { headers: auth(token) })
  caches.__inFlight.set(key, req)

  try {
    const value = await req
    caches.__cache.set(key, { at: Date.now(), value })
    return value
  } finally {
    caches.__inFlight.delete(key)
  }
}

export async function adminListUsers(
  token: string,
  params: { page?: number; q?: string; role_id?: number } = {},
  options: { cache?: boolean } = {},
) {
  const cache = options.cache ?? true
  const q = new URLSearchParams()
  if (params.page) q.set('page', String(params.page))
  if (params.q) q.set('q', params.q)
  if (params.role_id) q.set('role_id', String(params.role_id))
  const suffix = q.toString() ? `?${q.toString()}` : ''
  const path = `/admin/users${suffix}`

  const ADMIN_USERS_TTL_MS = 15_000
  const caches =
    (adminListUsers as unknown as {
      __cache?: Map<string, { at: number; value: AdminUserListResponse }>
      __inFlight?: Map<string, Promise<AdminUserListResponse>>
    })

  if (!caches.__cache) caches.__cache = new Map()
  if (!caches.__inFlight) caches.__inFlight = new Map()

  const key = `${token}|${path}`

  if (cache) {
    const hit = caches.__cache.get(key)
    if (hit && Date.now() - hit.at < ADMIN_USERS_TTL_MS) return hit.value

    const inflight = caches.__inFlight.get(key)
    if (inflight) return inflight
  }

  const req = apiRequest<AdminUserListResponse>(path, { headers: auth(token) })
  if (cache) caches.__inFlight.set(key, req)

  try {
    const value = await req
    if (cache) caches.__cache.set(key, { at: Date.now(), value })
    return value
  } finally {
    if (cache) caches.__inFlight.delete(key)
  }
}

export async function adminUpdateUser(token: string, userId: number, payload: { role_id?: number; name?: string; phone?: string | null }) {
  const res = await apiRequest<{ user: User }>(`/admin/users/${userId}`, {
    method: 'PATCH',
    headers: auth(token),
    body: payload as unknown as JsonValue,
  })

  invalidateAdminUsersCache()
  return res
}

export async function adminGetUser(token: string, userId: number) {
  return apiRequest<{ user: User }>(`/admin/users/${userId}`, { headers: auth(token) })
}

export async function adminDeleteUser(token: string, userId: number) {
  const res = await apiRequest<{ ok: boolean }>(`/admin/users/${userId}`, {
    method: 'DELETE',
    headers: auth(token),
  })

  invalidateAdminUsersCache()
  return res
}

export async function prefetchAdminUsers(token: string) {
  try {
    await Promise.all([adminListRoles(token), adminListUsers(token, { page: 1 })])
  } catch {
    // ignore
  }
}

function invalidateAdminUsersCache() {
  const caches =
    (adminListUsers as unknown as { __cache?: Map<string, { at: number; value: AdminUserListResponse }>; __inFlight?: Map<string, Promise<AdminUserListResponse>> })

  caches.__cache?.clear()
  caches.__inFlight?.clear()
}

export async function adminListQuotes(
  token: string,
  params: { page?: number; status?: string; product_id?: number; q?: string } = {},
) {
  const q = new URLSearchParams()
  if (params.page) q.set('page', String(params.page))
  if (params.status) q.set('status', params.status)
  if (params.product_id) q.set('product_id', String(params.product_id))
  if (params.q) q.set('q', params.q)
  const suffix = q.toString() ? `?${q.toString()}` : ''
  return apiRequest<AdminQuoteListResponse>(`/admin/quotes${suffix}`, { headers: auth(token) })
}

export async function adminGetQuote(token: string, quoteId: number) {
  return apiRequest<{ quote: Quote }>(`/admin/quotes/${quoteId}`, { headers: auth(token) })
}

export async function adminUpdateQuote(token: string, quoteId: number, payload: { status: string }) {
  return apiRequest<{ quote: Quote }>(`/admin/quotes/${quoteId}`, {
    method: 'PATCH',
    headers: auth(token),
    body: payload as unknown as JsonValue,
  })
}

export async function adminListProducts(
  token: string,
  params: {
    page?: number
    q?: string
    category_id?: number
    brand_id?: number
    status?: string
    sort_by?: 'id' | 'name' | 'codigo' | 'price' | 'stock_quantity' | 'status' | 'created_at'
    sort_dir?: 'asc' | 'desc'
  } = {},
  options: { cache?: boolean } = {},
) {
  const cache = options.cache ?? true
  const q = new URLSearchParams()
  if (params.page) q.set('page', String(params.page))
  if (params.q) q.set('q', params.q)
  if (params.category_id) q.set('category_id', String(params.category_id))
  if (params.brand_id) q.set('brand_id', String(params.brand_id))
  if (params.status) q.set('status', params.status)
  if (params.sort_by) q.set('sort_by', params.sort_by)
  if (params.sort_dir) q.set('sort_dir', params.sort_dir)
  const suffix = q.toString() ? `?${q.toString()}` : ''
  const path = `/admin/products${suffix}`

  const ADMIN_PRODUCTS_TTL_MS = 15_000
  // module-level singletons (declared via closures on function object)
  const caches =
    (adminListProducts as unknown as { __cache?: Map<string, { at: number; value: AdminProductListResponse }>; __inFlight?: Map<string, Promise<AdminProductListResponse>> })

  if (!caches.__cache) caches.__cache = new Map()
  if (!caches.__inFlight) caches.__inFlight = new Map()

  const key = `${token}|${path}`

  if (cache) {
    const hit = caches.__cache.get(key)
    if (hit && Date.now() - hit.at < ADMIN_PRODUCTS_TTL_MS) return hit.value

    const inflight = caches.__inFlight.get(key)
    if (inflight) return inflight
  }

  const req = apiRequest<AdminProductListResponse>(path, { headers: auth(token) })
  if (cache) caches.__inFlight.set(key, req)

  try {
    const value = await req
    if (cache) caches.__cache.set(key, { at: Date.now(), value })
    return value
  } finally {
    if (cache) caches.__inFlight.delete(key)
  }
}

export async function adminGetProduct(token: string, productId: number) {
  return apiRequest<{ product: AdminProduct }>(`/admin/products/${productId}`, { headers: auth(token) })
}

export async function adminCreateProduct(token: string, payload: Record<string, JsonValue>) {
  const res = await apiRequest<{ product: AdminProduct }>(`/admin/products`, {
    method: 'POST',
    headers: auth(token),
    body: payload,
  })

  invalidateAdminProductsCache()
  return res
}

export async function adminUpdateProduct(token: string, productId: number, payload: Record<string, JsonValue>) {
  const res = await apiRequest<{ product: AdminProduct }>(`/admin/products/${productId}`, {
    method: 'PATCH',
    headers: auth(token),
    body: payload,
  })

  invalidateAdminProductsCache()
  return res
}

export async function adminDeleteProduct(token: string, productId: number) {
  const res = await apiRequest<{ ok: boolean }>(`/admin/products/${productId}`, {
    method: 'DELETE',
    headers: auth(token),
  })

  invalidateAdminProductsCache()
  return res
}

export async function adminUploadProductImage(token: string, productId: number, file: File) {
  const fd = new FormData()
  fd.append('image', file)
  const res = await apiUpload<{ image: ProductImage }>(`/admin/products/${productId}/images`, fd, auth(token))
  invalidateAdminProductsCache()
  return res
}

export async function adminReorderProductImages(token: string, productId: number, imageIds: number[]) {
  const res = await apiRequest<{ images: ProductImage[] }>(`/admin/products/${productId}/images/reorder`, {
    method: 'PATCH',
    headers: auth(token),
    body: { image_ids: imageIds },
  })

  invalidateAdminProductsCache()
  return res
}

export async function adminSetPrimaryProductImage(token: string, imageId: number) {
  const res = await apiRequest<{ image: ProductImage }>(`/admin/product-images/${imageId}/primary`, {
    method: 'POST',
    headers: auth(token),
  })

  invalidateAdminProductsCache()
  return res
}

export async function adminDeleteProductImage(token: string, imageId: number) {
  const res = await apiRequest<{ ok: boolean }>(`/admin/product-images/${imageId}`, {
    method: 'DELETE',
    headers: auth(token),
  })

  invalidateAdminProductsCache()
  return res
}

export async function prefetchAdminProducts(token: string) {
  try {
    await adminListProducts(token, { page: 1 })
  } catch {
    // ignore
  }
}

function invalidateAdminProductsCache() {
  const caches =
    (adminListProducts as unknown as { __cache?: Map<string, { at: number; value: AdminProductListResponse }>; __inFlight?: Map<string, Promise<AdminProductListResponse>> })

  caches.__cache?.clear()
  caches.__inFlight?.clear()

  const dashCaches =
    (adminGetDashboard as unknown as { __cache?: Map<string, { at: number; value: AdminDashboardResponse }>; __inFlight?: Map<string, Promise<AdminDashboardResponse>> })

  dashCaches.__cache?.clear()
  dashCaches.__inFlight?.clear()
}

export async function adminListCategories(token: string, params: { page?: number } = {}) {
  const q = new URLSearchParams()
  if (params.page) q.set('page', String(params.page))
  const suffix = q.toString() ? `?${q.toString()}` : ''
  return apiRequest<AdminCategoryListResponse>(`/admin/categories${suffix}`, { headers: auth(token) })
}

export async function adminCreateCategory(
  token: string,
  payload: { name: string; slug: string; parent_id?: number | null },
) {
  return apiRequest<{ category: Category }>(`/admin/categories`, {
    method: 'POST',
    headers: auth(token),
    body: payload,
  })
}

export async function adminUpdateCategory(
  token: string,
  categoryId: number,
  payload: { name?: string; slug?: string; parent_id?: number | null },
) {
  return apiRequest<{ category: Category }>(`/admin/categories/${categoryId}`, {
    method: 'PATCH',
    headers: auth(token),
    body: payload,
  })
}

export async function adminDeleteCategory(token: string, categoryId: number) {
  return apiRequest<{ ok: boolean }>(`/admin/categories/${categoryId}`, {
    method: 'DELETE',
    headers: auth(token),
  })
}

const ADMIN_BRANDS_TTL_MS = 60_000
const adminBrandsCache = new Map<string, { at: number; value: AdminBrandListResponse }>()
const adminBrandsInFlight = new Map<string, Promise<AdminBrandListResponse>>()

export async function adminListBrands(
  token: string,
  params: { page?: number } = {},
  options: { cache?: boolean } = {},
) {
  const cache = options.cache ?? true
  const q = new URLSearchParams()
  if (params.page) q.set('page', String(params.page))
  const suffix = q.toString() ? `?${q.toString()}` : ''
  const path = `/admin/brands${suffix}`
  const key = `${token}|${path}`

  if (cache) {
    const hit = adminBrandsCache.get(key)
    if (hit && Date.now() - hit.at < ADMIN_BRANDS_TTL_MS) return hit.value

    const inflight = adminBrandsInFlight.get(key)
    if (inflight) return inflight
  }

  const req = apiRequest<AdminBrandListResponse>(path, { headers: auth(token) })
  if (cache) adminBrandsInFlight.set(key, req)

  try {
    const value = await req
    if (cache) adminBrandsCache.set(key, { at: Date.now(), value })
    return value
  } finally {
    if (cache) adminBrandsInFlight.delete(key)
  }
}

export async function adminCreateBrand(token: string, payload: { name: string; slug: string }) {
  return apiRequest<{ brand: Brand }>(`/admin/brands`, {
    method: 'POST',
    headers: auth(token),
    body: payload,
  })
}

export async function adminUpdateBrand(token: string, brandId: number, payload: { name?: string; slug?: string }) {
  return apiRequest<{ brand: Brand }>(`/admin/brands/${brandId}`, {
    method: 'PATCH',
    headers: auth(token),
    body: payload,
  })
}

export async function adminDeleteBrand(token: string, brandId: number) {
  return apiRequest<{ ok: boolean }>(`/admin/brands/${brandId}`, {
    method: 'DELETE',
    headers: auth(token),
  })
}

export async function adminUploadBrandLogo(token: string, brandId: number, file: File) {
  const fd = new FormData()
  fd.append('logo', file)
  return apiUpload<{ brand: Brand }>(`/admin/brands/${brandId}/logo`, fd, auth(token))
}

export async function prefetchAdminBrands(token: string) {
  try {
    await adminListBrands(token)
  } catch {
    // ignore
  }
}

export async function adminListPaymentMethods(token: string, params: { page?: number } = {}) {
  const q = new URLSearchParams()
  if (params.page) q.set('page', String(params.page))
  const suffix = q.toString() ? `?${q.toString()}` : ''
  return apiRequest<AdminPaymentMethodListResponse>(`/admin/payment-methods${suffix}`, { headers: auth(token) })
}

export async function adminCreatePaymentMethod(token: string, payload: Partial<PaymentMethod> & { name: string }) {
  return apiRequest<{ payment_method: PaymentMethod }>(`/admin/payment-methods`, {
    method: 'POST',
    headers: auth(token),
    body: payload,
  })
}

export async function adminUpdatePaymentMethod(
  token: string,
  paymentMethodId: number,
  payload: Partial<PaymentMethod>,
) {
  return apiRequest<{ payment_method: PaymentMethod }>(`/admin/payment-methods/${paymentMethodId}`, {
    method: 'PATCH',
    headers: auth(token),
    body: payload,
  })
}

export async function adminDeletePaymentMethod(token: string, paymentMethodId: number) {
  return apiRequest<{ ok: boolean }>(`/admin/payment-methods/${paymentMethodId}`, {
    method: 'DELETE',
    headers: auth(token),
  })
}

export async function adminListFaqs(token: string, params: { page?: number } = {}) {
  const q = new URLSearchParams()
  if (params.page) q.set('page', String(params.page))
  const suffix = q.toString() ? `?${q.toString()}` : ''
  return apiRequest<AdminFaqListResponse>(`/admin/faqs${suffix}`, { headers: auth(token) })
}

export async function adminCreateFaq(token: string, payload: { question: string; answer: string; order?: number }) {
  return apiRequest<{ faq: Faq }>(`/admin/faqs`, {
    method: 'POST',
    headers: auth(token),
    body: payload,
  })
}

export async function adminUpdateFaq(token: string, faqId: number, payload: Partial<Faq>) {
  return apiRequest<{ faq: Faq }>(`/admin/faqs/${faqId}`, {
    method: 'PATCH',
    headers: auth(token),
    body: payload,
  })
}

export async function adminDeleteFaq(token: string, faqId: number) {
  return apiRequest<{ ok: boolean }>(`/admin/faqs/${faqId}`, {
    method: 'DELETE',
    headers: auth(token),
  })
}

export async function adminListSettings(token: string, params: { page?: number } = {}) {
  const q = new URLSearchParams()
  if (params.page) q.set('page', String(params.page))
  const suffix = q.toString() ? `?${q.toString()}` : ''
  return apiRequest<AdminSettingListResponse>(`/admin/settings${suffix}`, { headers: auth(token) })
}

export async function adminCreateSetting(token: string, payload: { key: string; value?: string | null }) {
  return apiRequest<{ setting: Setting }>(`/admin/settings`, {
    method: 'POST',
    headers: auth(token),
    body: payload,
  })
}

export async function adminUpdateSetting(token: string, settingId: number, payload: Partial<Setting>) {
  return apiRequest<{ setting: Setting }>(`/admin/settings/${settingId}`, {
    method: 'PATCH',
    headers: auth(token),
    body: payload,
  })
}

export async function adminDeleteSetting(token: string, settingId: number) {
  return apiRequest<{ ok: boolean }>(`/admin/settings/${settingId}`, {
    method: 'DELETE',
    headers: auth(token),
  })
}
