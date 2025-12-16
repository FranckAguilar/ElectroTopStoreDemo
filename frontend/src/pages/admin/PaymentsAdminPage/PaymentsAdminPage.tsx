import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/features/auth/AuthContext'
import type { AdminPayment } from '@/features/admin/adminApi'
import { adminListPayments, adminUpdatePayment } from '@/features/admin/adminApi'
import { ErrorMessage } from '@/shared/components/ErrorMessage'
import { Loading } from '@/shared/components/Loading'
import { Pagination } from '@/shared/components/Pagination'
import { useToast } from '@/shared/components/ToastProvider'
import { nextPaymentStatuses, paymentStatusLabels, type PaymentStatus } from '@/shared/utils/status'

export function PaymentsAdminPage() {
  const navigate = useNavigate()
  const { token } = useAuth()
  const { push } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Number(searchParams.get('page') ?? '1') || 1
  const [payments, setPayments] = useState<AdminPayment[]>([])
  const [meta, setMeta] = useState<{ current_page: number; last_page: number } | null>(null)
  const [isFetching, setIsFetching] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) {
      navigate('/admin/login')
      return
    }

    let cancelled = false
    setIsFetching(true)
    setError(null)

    void (async () => {
      try {
        const result = await adminListPayments(token, { page })
        if (cancelled) return
        setPayments(result.data)
        if (result.meta) setMeta({ current_page: result.meta.current_page, last_page: result.meta.last_page })
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Error cargando pagos.')
      } finally {
        if (!cancelled) setIsFetching(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [token, navigate, page])

  if (isFetching && payments.length === 0) return <Loading />
  if (error) return <ErrorMessage message={error} />

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <h1 className="text-xl font-semibold">Pagos</h1>
        {isFetching ? <div className="text-xs font-semibold text-slate-500">{`Actualizando\u2026`}</div> : null}
      </div>
      <div className="rounded-2xl border bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-slate-50 text-xs font-semibold text-slate-600">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Pedido</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Monto</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Comprobante</th>
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => {
                const current = (p.status ?? 'pending') as PaymentStatus
                const allowed = nextPaymentStatuses(current)

                return (
                  <tr key={p.id} className="border-b last:border-b-0">
                    <td className="px-4 py-3 font-semibold">#{p.id}</td>
                    <td className="px-4 py-3">#{p.order_id}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-800">{p.order?.user?.name ?? '\u2014'}</div>
                      <div className="text-xs text-slate-500">{p.order?.user?.email ?? ''}</div>
                    </td>
                    <td className="px-4 py-3 font-bold">S/ {p.amount}</td>
                    <td className="px-4 py-3">
                      <select
                        className="rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:border-brand-600"
                        value={current}
                        onChange={async (e) => {
                          if (!token) return
                          const next = e.target.value as PaymentStatus
                          try {
                            await adminUpdatePayment(token, p.id, { status: next })
                            setPayments((prev) => prev.map((x) => (x.id === p.id ? { ...x, status: next } : x)))
                            push({ type: 'success', title: 'Estado actualizado' })
                          } catch (err) {
                            push({ type: 'error', title: 'No se pudo actualizar', message: err instanceof Error ? err.message : undefined })
                          }
                        }}
                      >
                        <option value={current}>{paymentStatusLabels[current]}</option>
                        {allowed.map((s) => (
                          <option key={s} value={s}>
                            {paymentStatusLabels[s]}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      {p.proof_url ? (
                        <a
                          className="text-xs font-semibold text-brand-700 hover:underline"
                          href={p.proof_url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Ver
                        </a>
                      ) : (
                        <span className="text-xs text-slate-500">Sin</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Link to={`/admin/payments/${p.id}`} className="text-xs font-semibold text-brand-700 hover:underline">
                        Ver detalles
                      </Link>
                    </td>
                  </tr>
                )
              })}
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-600">
                    No hay pagos.
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
