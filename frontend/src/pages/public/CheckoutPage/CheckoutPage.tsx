import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listPaymentMethods } from '@/entities/paymentMethod/api'
import type { PaymentMethod } from '@/entities/paymentMethod/types'
import { useAuth } from '@/features/auth/AuthContext'
import { useCart } from '@/features/cart/CartContext'
import { checkout as checkoutApi } from '@/features/cart/cartApi'
import { ErrorMessage } from '@/shared/components/ErrorMessage'
import { Loading } from '@/shared/components/Loading'

export function CheckoutPage() {
  const navigate = useNavigate()
  const { token } = useAuth()
  const { cart, isLoading: cartLoading, refresh } = useCart()

  const [methods, setMethods] = useState<PaymentMethod[]>([])
  const [paymentMethodId, setPaymentMethodId] = useState<number | null>(null)
  const [shippingAddress, setShippingAddress] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canCheckout = useMemo(
    () => Boolean(token) && Boolean(paymentMethodId) && (cart?.items?.length ?? 0) > 0,
    [token, paymentMethodId, cart?.items?.length],
  )

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const result = await listPaymentMethods()
        if (cancelled) return
        setMethods(result.data)
        setPaymentMethodId((prev) => prev ?? result.data[0]?.id ?? null)
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Error cargando métodos de pago.')
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  if (!token) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold">Checkout</h1>
        <ErrorMessage message="Necesitas iniciar sesión para finalizar la compra." />
      </div>
    )
  }

  if (cartLoading) return <Loading />

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Checkout</h1>
      {error ? <ErrorMessage message={error} /> : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border bg-white p-6 lg:col-span-2">
          <div className="text-sm font-semibold">Datos de entrega</div>
          <textarea
            className="mt-2 min-h-28 w-full rounded-xl border p-3 text-sm outline-none focus:border-brand-600"
            placeholder="Dirección de envío (opcional)"
            value={shippingAddress}
            onChange={(e) => setShippingAddress(e.target.value)}
          />

          <div className="mt-5 text-sm font-semibold">Método de pago</div>
          <select
            className="mt-2 w-full rounded-xl border bg-white p-3 text-sm outline-none focus:border-brand-600"
            value={paymentMethodId ?? ''}
            onChange={(e) => setPaymentMethodId(Number(e.target.value))}
          >
            {methods.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>

          <button
            className="mt-6 w-full rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
            disabled={!canCheckout || isLoading}
            onClick={async () => {
              if (!token || !paymentMethodId) return
              setIsLoading(true)
              setError(null)
              try {
                const result = await checkoutApi(
                  { Authorization: `Bearer ${token}` },
                  { payment_method_id: paymentMethodId, shipping_address: shippingAddress || null },
                )
                await refresh()
                navigate(`/mis-pedidos?order_id=${result.order_id}`)
              } catch (e) {
                setError(e instanceof Error ? e.message : 'Error al generar pedido.')
              } finally {
                setIsLoading(false)
              }
            }}
          >
            {isLoading ? 'Procesando…' : 'Confirmar pedido'}
          </button>
        </div>

        <div className="rounded-2xl border bg-white p-6">
          <div className="text-sm font-semibold">Resumen</div>
          <div className="mt-3 text-sm text-slate-700">
            Total: <span className="font-semibold">S/ {cart?.total_amount ?? '0.00'}</span>
          </div>
          <div className="mt-4 space-y-2">
            {(cart?.items ?? []).map((i) => (
              <div key={i.id} className="flex items-center justify-between gap-3 text-xs text-slate-600">
                <span className="truncate">{i.product?.name ?? `Item #${i.id}`}</span>
                <span className="font-semibold">x{i.quantity}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
