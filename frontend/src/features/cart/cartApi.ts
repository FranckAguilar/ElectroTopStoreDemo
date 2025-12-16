import { apiRequest } from '@/shared/api/client'

export type Cart = {
  id: number
  total_amount: string
  items: Array<{
    id: number
    quantity: number
    unit_price: string
    product?: {
      id: number
      codigo: string
      name: string
      description?: string | null
      price: string
      stock_quantity: number
      status: string
      images?: Array<{ id: number; url?: string | null; image_path: string; order: number }>
    }
  }>
}

export async function createCartSession(): Promise<{ session_id: string }> {
  return apiRequest('/cart/session', { method: 'POST' })
}

export async function getCart(headers: Record<string, string>): Promise<{ data: Cart }> {
  return apiRequest('/cart', { headers })
}

export async function addCartItem(
  headers: Record<string, string>,
  payload: { product_id: number; quantity: number },
): Promise<{ data: Cart }> {
  return apiRequest('/cart/items', { method: 'POST', headers, body: payload })
}

export async function updateCartItem(
  headers: Record<string, string>,
  itemId: number,
  payload: { quantity: number },
): Promise<{ data: Cart }> {
  return apiRequest(`/cart/items/${itemId}`, { method: 'PATCH', headers, body: payload })
}

export async function deleteCartItem(headers: Record<string, string>, itemId: number): Promise<{ data: Cart }> {
  return apiRequest(`/cart/items/${itemId}`, { method: 'DELETE', headers })
}

export async function checkout(
  headers: Record<string, string>,
  payload: { payment_method_id: number; shipping_address?: string | null },
): Promise<{ order_id: number; total_amount: string }> {
  return apiRequest('/cart/checkout', { method: 'POST', headers, body: payload })
}

