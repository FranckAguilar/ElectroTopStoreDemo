import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import type { Quote } from '@/entities/quote/types'
import { useAuth } from '@/features/auth/AuthContext'
import { adminGetQuote, adminUpdateQuote } from '@/features/admin/adminApi'
import { ErrorMessage } from '@/shared/components/ErrorMessage'
import { Loading } from '@/shared/components/Loading'
import { useToast } from '@/shared/components/ToastProvider'

const quoteStatusOptions = ['pending', 'contacted', 'closed', 'cancelled'] as const

export function QuoteAdminDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const quoteId = Number(id)
  const { token } = useAuth()
  const { push } = useToast()

  const [quote, setQuote] = useState<Quote | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const title = useMemo(() => (quote ? `Cotización #${quote.id}` : 'Cotización'), [quote])

  useEffect(() => {
    if (!token) {
      navigate('/admin/login')
      return
    }
    if (!quoteId) {
      setError('ID de cotización inválido.')
      setIsLoading(false)
      return
    }

    let cancelled = false
    setIsLoading(true)
    setError(null)

    void (async () => {
      try {
        const res = await adminGetQuote(token, quoteId)
        if (!cancelled) setQuote(res.quote)
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Error cargando cotización.')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [token, navigate, quoteId])

  if (isLoading) return <Loading />
  if (error) return <ErrorMessage message={error} />
  if (!quote) return <ErrorMessage message="Cotización no encontrada." />

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">{title}</h1>
          <p className="mt-1 text-sm text-slate-600">{quote.contact_email}</p>
        </div>
        <Link to="/admin/quotes" className="rounded-lg border px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
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
                value={quote.status}
                onChange={async (e) => {
                  if (!token) return
                  const next = e.target.value
                  try {
                    const res = await adminUpdateQuote(token, quote.id, { status: next })
                    setQuote(res.quote)
                    push({ type: 'success', title: 'Estado actualizado' })
                  } catch (err) {
                    push({ type: 'error', title: 'No se pudo actualizar', message: err instanceof Error ? err.message : undefined })
                  }
                }}
              >
                {[quote.status, ...quoteStatusOptions].filter((v, i, arr) => arr.indexOf(v) === i).map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border bg-slate-50 p-4">
              <div className="text-xs font-semibold text-slate-600">Contacto</div>
              <div className="mt-1 text-sm font-semibold text-slate-900">{quote.contact_name}</div>
              <div className="text-xs text-slate-600">{quote.contact_email}</div>
              {quote.contact_phone ? <div className="text-xs text-slate-600">{quote.contact_phone}</div> : null}
            </div>
            <div className="rounded-xl border bg-slate-50 p-4">
              <div className="text-xs font-semibold text-slate-600">Producto</div>
              <div className="mt-1 text-sm font-semibold text-slate-900">{quote.product?.name ?? '—'}</div>
              <div className="text-xs text-slate-600">{quote.product?.codigo ?? ''}</div>
              <div className="mt-2 text-xs text-slate-600">Cantidad: {quote.quantity}</div>
            </div>
          </div>

          <div className="mt-4 rounded-xl border p-4">
            <div className="text-sm font-semibold">Mensaje</div>
            <div className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{quote.message ?? '—'}</div>
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-6">
          <div className="text-sm font-semibold">Datos</div>
          <div className="mt-3 space-y-2 text-sm text-slate-700">
            <div>
              <span className="text-xs font-semibold text-slate-600">Creado:</span>{' '}
              {quote.created_at ? new Date(quote.created_at).toLocaleString() : '—'}
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-600">Usuario:</span>{' '}
              {quote.user ? `${quote.user.name} (${quote.user.email})` : 'Guest'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
