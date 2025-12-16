import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import type { Order } from '@/entities/order/types'
import type { AdminPayment } from '@/features/admin/adminApi'
import { adminGetOrder, adminListPayments, adminUpdateOrder } from '@/features/admin/adminApi'
import { useAuth } from '@/features/auth/AuthContext'
import { ErrorMessage } from '@/shared/components/ErrorMessage'
import { Loading } from '@/shared/components/Loading'
import { useToast } from '@/shared/components/ToastProvider'
import { nextOrderStatuses, orderStatusLabels, type OrderStatus } from '@/shared/utils/status'

export function OrderAdminDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const orderId = Number(id)
  const { token } = useAuth()
  const { push } = useToast()

  const [order, setOrder] = useState<Order | null>(null)
  const [payments, setPayments] = useState<AdminPayment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) {
      navigate('/admin/login')
      return
    }
    if (!orderId) {
      setError('ID de pedido inválido.')
      setIsLoading(false)
      return
    }

    let cancelled = false
    setIsLoading(true)
    setError(null)

    void (async () => {
      try {
        const [o, p] = await Promise.all([adminGetOrder(token, orderId), adminListPayments(token, { order_id: orderId })])
        if (cancelled) return
        setOrder(o.order)
        setPayments(p.data)
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Error cargando pedido.')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [token, navigate, orderId])

  if (isLoading) return <Loading />
  if (error) return <ErrorMessage message={error} />
  if (!order) return <ErrorMessage message="Pedido no encontrado." />

  const current = (order.status ?? 'pending') as OrderStatus
  const allowed = nextOrderStatuses(current)

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Pedido #{order.id}</h1>
          <p className="mt-1 text-sm text-slate-600">{order.user?.email ?? ''}</p>
        </div>
        <Link to="/admin/orders" className="rounded-lg border px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
          Volver
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border bg-white p-6 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm font-semibold">Detalle</div>
            <div className="flex items-center gap-2">
              <div className="text-xs font-semibold text-slate-600">Estado</div>
              <select
                className="rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:border-brand-600"
                value={current}
                onChange={async (e) => {
                  if (!token) return
                  const next = e.target.value as OrderStatus
                  try {
                    await adminUpdateOrder(token, order.id, { order_status: next })
                    setOrder((prev) => (prev ? { ...prev, status: next } : prev))
                    push({ type: 'success', title: 'Estado actualizado' })
                  } catch (err) {
                    push({ type: 'error', title: 'No se pudo actualizar', message: err instanceof Error ? err.message : undefined })
                  }
                }}
              >
                <option value={current}>{orderStatusLabels[current]}</option>
                {allowed.map((s) => (
                  <option key={s} value={s}>
                    {orderStatusLabels[s]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border bg-slate-50 p-4">
              <div className="text-xs font-semibold text-slate-600">Cliente</div>
              <div className="mt-1 text-sm font-semibold text-slate-900">{order.user?.name ?? '—'}</div>
              <div className="text-xs text-slate-600">{order.user?.email ?? '—'}</div>
            </div>
            <div className="rounded-xl border bg-slate-50 p-4">
              <div className="text-xs font-semibold text-slate-600">Total</div>
              <div className="mt-1 text-sm font-bold text-slate-900">S/ {order.total_amount}</div>
              <div className="text-xs text-slate-600">{order.placed_at ? new Date(order.placed_at).toLocaleString() : ''}</div>
            </div>
          </div>

          <div className="mt-4 rounded-xl border">
            <div className="border-b bg-slate-50 px-4 py-3 text-sm font-semibold">Items</div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b text-xs font-semibold text-slate-600">
                  <tr>
                    <th className="px-4 py-3">Producto</th>
                    <th className="px-4 py-3">Cant.</th>
                    <th className="px-4 py-3">Unit.</th>
                    <th className="px-4 py-3">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {(order.items ?? []).map((it) => (
                    <tr key={it.id} className="border-b last:border-b-0">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{it.product?.name ?? `#${it.product?.id ?? ''}`}</div>
                        <div className="text-xs text-slate-600">{it.product?.codigo ?? ''}</div>
                      </td>
                      <td className="px-4 py-3">{it.quantity}</td>
                      <td className="px-4 py-3">S/ {it.unit_price}</td>
                      <td className="px-4 py-3 font-semibold">S/ {it.subtotal}</td>
                    </tr>
                  ))}
                  {(order.items ?? []).length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-10 text-center text-sm text-slate-600">
                        Sin items.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-6">
          <div className="text-sm font-semibold">Pagos</div>
          <div className="mt-3 space-y-3">
            {payments.map((p) => (
              <Link
                key={p.id}
                to={`/admin/payments/${p.id}`}
                className="block rounded-xl border p-4 hover:bg-slate-50"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-slate-900">Pago #{p.id}</div>
                  <div className="text-xs font-semibold text-slate-600">{p.status}</div>
                </div>
                <div className="mt-1 text-xs text-slate-600">
                  {p.payment_method?.name ?? '—'} · S/ {p.amount}
                </div>
              </Link>
            ))}
            {payments.length === 0 ? <div className="text-sm text-slate-600">Sin pagos.</div> : null}
          </div>
        </div>
      </div>
    </div>
  )
}
