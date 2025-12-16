/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { addCartItem, createCartSession, deleteCartItem, getCart, type Cart, updateCartItem } from '@/features/cart/cartApi'
import { getSessionId, setSessionId } from '@/features/cart/cartStorage'
import { useAuth } from '@/features/auth/AuthContext'

type CartState = {
  sessionId: string | null
  cart: Cart | null
  isLoading: boolean
  refresh: () => Promise<void>
  add: (productId: number, quantity?: number) => Promise<void>
  setQuantity: (itemId: number, quantity: number) => Promise<void>
  remove: (itemId: number) => Promise<void>
}

const CartContext = createContext<CartState | null>(null)

function headers(token: string | null, sessionId: string | null): Record<string, string> {
  if (token) return { Authorization: `Bearer ${token}` }
  if (sessionId) return { 'X-Session-Id': sessionId }
  return {}
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { token: customerToken } = useAuth()
  const [sessionIdState, setSessionIdState] = useState<string | null>(() => getSessionId())
  const [cart, setCart] = useState<Cart | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const ensureSession = useCallback(async () => {
    if (customerToken) return
    if (sessionIdState) return

    const result = await createCartSession()
    setSessionId(result.session_id)
    setSessionIdState(result.session_id)
  }, [customerToken, sessionIdState])

  const refresh = useCallback(async () => {
    await ensureSession()
    setIsLoading(true)
    try {
      const result = await getCart(headers(customerToken, sessionIdState))
      setCart(result.data)
    } finally {
      setIsLoading(false)
    }
  }, [customerToken, ensureSession, sessionIdState])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const add = useCallback(
    async (productId: number, quantity = 1) => {
      await ensureSession()
      setIsLoading(true)
      try {
        const result = await addCartItem(headers(customerToken, sessionIdState), {
          product_id: productId,
          quantity,
        })
        setCart(result.data)
      } finally {
        setIsLoading(false)
      }
    },
    [customerToken, ensureSession, sessionIdState],
  )

  const setQuantity = useCallback(
    async (itemId: number, quantity: number) => {
      await ensureSession()
      setIsLoading(true)
      try {
        const result = await updateCartItem(headers(customerToken, sessionIdState), itemId, { quantity })
        setCart(result.data)
      } finally {
        setIsLoading(false)
      }
    },
    [customerToken, ensureSession, sessionIdState],
  )

  const remove = useCallback(
    async (itemId: number) => {
      await ensureSession()
      setIsLoading(true)
      try {
        const result = await deleteCartItem(headers(customerToken, sessionIdState), itemId)
        setCart(result.data)
      } finally {
        setIsLoading(false)
      }
    },
    [customerToken, ensureSession, sessionIdState],
  )

  const value = useMemo<CartState>(
    () => ({
      sessionId: sessionIdState,
      cart,
      isLoading,
      refresh,
      add,
      setQuantity,
      remove,
    }),
    [sessionIdState, cart, isLoading, refresh, add, setQuantity, remove],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
