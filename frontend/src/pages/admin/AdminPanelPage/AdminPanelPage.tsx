import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/AuthContext'
import { adminGetDashboard, type AdminDashboardResponse } from '@/features/admin/adminApi'
import { ErrorMessage } from '@/shared/components/ErrorMessage'
import { Loading } from '@/shared/components/Loading'

export function AdminPanelPage() {
  const navigate = useNavigate()
  const { token } = useAuth()

  const [stats, setStats] = useState<AdminDashboardResponse['stats'] | null>(null)
  const [recentOrders, setRecentOrders] = useState<AdminDashboardResponse['recent_orders']>([])
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
        const res = await adminGetDashboard(token)
        if (cancelled) return
        setStats(res.stats)
        setRecentOrders(res.recent_orders)
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Error cargando panel.')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [token, navigate])

  if (isLoading) return <Loading />
  if (error) return <ErrorMessage message={error} />

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Panel</h1>
          <p className="mt-1 text-sm text-slate-600">Resumen rápido de tu negocio.</p>
        </div>
        <Link
          to="/admin/products"
          className="rounded-lg border px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Ir a productos
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border bg-white p-6">
          <div className="text-xs font-semibold text-slate-600">Total productos</div>
          <div className="mt-1 text-3xl font-extrabold text-slate-900">{stats?.products ?? 0}</div>
          <div className="mt-3 text-xs text-slate-600">
            <Link to="/admin/products" className="font-semibold text-brand-700 hover:underline">
              Administrar productos
            </Link>
          </div>
        </div>
        <div className="rounded-2xl border bg-white p-6">
          <div className="text-xs font-semibold text-slate-600">Total pedidos</div>
          <div className="mt-1 text-3xl font-extrabold text-slate-900">{stats?.orders ?? 0}</div>
          <div className="mt-3 text-xs text-slate-600">
            <Link to="/admin/orders" className="font-semibold text-brand-700 hover:underline">
              Ver pedidos
            </Link>
          </div>
        </div>
        <div className="rounded-2xl border bg-white p-6">
          <div className="text-xs font-semibold text-slate-600">Total pagos</div>
          <div className="mt-1 text-3xl font-extrabold text-slate-900">{stats?.payments ?? 0}</div>
          <div className="mt-3 text-xs text-slate-600">
            <Link to="/admin/payments" className="font-semibold text-brand-700 hover:underline">
              Ver pagos
            </Link>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border bg-white">
        <div className="flex items-center justify-between border-b bg-slate-50 px-4 py-3">
          <div className="text-sm font-semibold">Pedidos recientes</div>
          <Link to="/admin/orders" className="text-xs font-semibold text-brand-700 hover:underline">
            Ver todos
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b text-xs font-semibold text-slate-600">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((o) => (
                <tr key={o.id} className="border-b last:border-b-0">
                  <td className="px-4 py-3 font-semibold">
                    <Link to={`/admin/orders/${o.id}`} className="text-brand-700 hover:underline">
                      #{o.id}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-900">{o.user?.name ?? '—'}</div>
                    <div className="text-xs text-slate-600">{o.user?.email ?? ''}</div>
                  </td>
                  <td className="px-4 py-3 font-bold">S/ {o.total_amount}</td>
                  <td className="px-4 py-3 text-xs font-semibold text-slate-700">{o.status ?? 'pending'}</td>
                  <td className="px-4 py-3 text-xs text-slate-600">
                    {o.placed_at ? new Date(o.placed_at).toLocaleString() : '—'}
                  </td>
                </tr>
              ))}
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-600">
                    No hay pedidos todavía.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
