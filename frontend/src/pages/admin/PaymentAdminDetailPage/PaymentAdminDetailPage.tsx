import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import type { AdminPayment } from '@/features/admin/adminApi'
import { adminGetPayment, adminUpdatePayment } from '@/features/admin/adminApi'
import { useAuth } from '@/features/auth/AuthContext'
import { ErrorMessage } from '@/shared/components/ErrorMessage'
import { Loading } from '@/shared/components/Loading'
import { useToast } from '@/shared/components/ToastProvider'
import { nextPaymentStatuses, paymentStatusLabels, type PaymentStatus } from '@/shared/utils/status'

export function PaymentAdminDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const paymentId = Number(id)
  const { token } = useAuth()
  const { push } = useToast()

  const [payment, setPayment] = useState<AdminPayment | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const isImage = useMemo(() => {
    const url = payment?.proof_url
    if (!url) return false
    return /\.(png|jpe?g|webp)$/i.test(url)
  }, [payment?.proof_url])

  useEffect(() => {
    if (!token) {
      navigate('/admin/login')
      return
    }
    if (!paymentId) {
      setError(`ID de pago inv\u00e1lido.`)
      setIsLoading(false)
      return
    }

    let cancelled = false
    setIsLoading(true)
    setError(null)

    void (async () => {
      try {
        const res = await adminGetPayment(token, paymentId)
        if (!cancelled) setPayment(res.payment)
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Error cargando pago.')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [token, navigate, paymentId])

  if (isLoading) return <Loading />
  if (error) return <ErrorMessage message={error} />
  if (!payment) return <ErrorMessage message="Pago no encontrado." />

  const current = (payment.status ?? 'pending') as PaymentStatus
  const allowed = nextPaymentStatuses(current)

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Pago #{payment.id}</h1>
          <p className="mt-1 text-sm text-slate-600">Orden #{payment.order_id}</p>
        </div>
        <Link
          to="/admin/payments"
          className="rounded-lg border px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
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
                  const next = e.target.value as PaymentStatus
                  try {
                    await adminUpdatePayment(token, payment.id, { status: next })
                    setPayment((prev) => (prev ? { ...prev, status: next } : prev))
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
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border bg-slate-50 p-4">
              <div className="text-xs font-semibold text-slate-600">{`M\u00e9todo`}</div>
              <div className="mt-1 text-sm font-semibold text-slate-900">{payment.payment_method?.name ?? '\u2014'}</div>
              <div className="text-xs text-slate-600">S/ {payment.amount}</div>
            </div>
            <div className="rounded-xl border bg-slate-50 p-4">
              <div className="text-xs font-semibold text-slate-600">Referencia</div>
              <div className="mt-1 text-sm font-semibold text-slate-900">{payment.transaction_reference ?? '\u2014'}</div>
              <div className="text-xs text-slate-600">{payment.created_at ? new Date(payment.created_at).toLocaleString() : ''}</div>
            </div>
          </div>

          <div className="mt-4 rounded-xl border p-4">
            <div className="text-sm font-semibold">Comprobante</div>
            {payment.proof_url ? (
              <div className="mt-3 space-y-3">
                <a
                  href={payment.proof_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex rounded-lg border px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Abrir archivo
                </a>
                {isImage ? (
                  <div className="overflow-hidden rounded-xl border bg-slate-50">
                    <img src={payment.proof_url} alt="Comprobante" className="w-full object-contain" />
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="mt-2 text-sm text-slate-600">No hay comprobante subido.</div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-6">
          <div className="text-sm font-semibold">{`Navegaci\u00f3n`}</div>
          <div className="mt-3 space-y-2">
            <Link
              to={`/admin/orders/${payment.order_id}`}
              className="block rounded-xl border px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Ver pedido #{payment.order_id}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
