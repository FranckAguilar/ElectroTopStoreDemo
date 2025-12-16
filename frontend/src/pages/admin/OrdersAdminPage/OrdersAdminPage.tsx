import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import type { Order } from '@/entities/order/types'
import { useAuth } from '@/features/auth/AuthContext'
import { adminListOrders, adminUpdateOrder } from '@/features/admin/adminApi'
import { ErrorMessage } from '@/shared/components/ErrorMessage'
import { Loading } from '@/shared/components/Loading'
import { Pagination } from '@/shared/components/Pagination'
import { useToast } from '@/shared/components/ToastProvider'
import { nextOrderStatuses, orderStatusLabels, type OrderStatus } from '@/shared/utils/status'

export function OrdersAdminPage() {
  const navigate = useNavigate()
  const { token } = useAuth()
  const { push } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Number(searchParams.get('page') ?? '1') || 1
  const [orders, setOrders] = useState<Order[]>([])
  const [meta, setMeta] = useState<{ current_page: number; last_page: number } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) {
      navigate('/admin/login')
      return
    }

    let cancelled = false
    setIsLoading(true)
    setError(null)

    void (async () => {
      try {
        const result = await adminListOrders(token, { page })
        if (cancelled) return
        setOrders(result.data)
        if (result.meta) setMeta({ current_page: result.meta.current_page, last_page: result.meta.last_page })
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Error cargando pedidos.')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [token, navigate, page])

  if (isLoading) return <Loading />
  if (error) return <ErrorMessage message={error} />

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Pedidos</h1>

      <div className="rounded-2xl border bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-slate-50 text-xs font-semibold text-slate-600">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => {
                const current = (o.status ?? 'pending') as OrderStatus
                const allowed = nextOrderStatuses(current)

                return (
                  <tr key={o.id} className="border-b last:border-b-0">
                    <td className="px-4 py-3 font-semibold">#{o.id}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-800">{o.user?.name ?? '—'}</div>
                      <div className="text-xs text-slate-500">{o.user?.email ?? ''}</div>
                    </td>
                    <td className="px-4 py-3 font-bold">S/ {o.total_amount}</td>
                    <td className="px-4 py-3">
                      <select
                        className="rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:border-brand-600"
                        value={current}
                        onChange={async (e) => {
                          if (!token) return
                          const next = e.target.value as OrderStatus
                          try {
                            await adminUpdateOrder(token, o.id, { order_status: next })
                            setOrders((prev) => prev.map((x) => (x.id === o.id ? { ...x, status: next } : x)))
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
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {o.placed_at ? new Date(o.placed_at).toLocaleString() : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <Link to={`/admin/orders/${o.id}`} className="text-xs font-semibold text-brand-700 hover:underline">
                        Ver detalles
                      </Link>
                    </td>
                  </tr>
                )
              })}
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-600">
                    No hay pedidos.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      {meta ? (
        <Pagination
          currentPage={meta.current_page}
          lastPage={meta.last_page}
          onPageChange={(nextPage) => {
            const next = new URLSearchParams(searchParams)
            next.set('page', String(nextPage))
            setSearchParams(next)
          }}
        />
      ) : null}
    </div>
  )
}
