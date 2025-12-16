import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import type { Quote } from '@/entities/quote/types'
import { useAuth } from '@/features/auth/AuthContext'
import { adminListQuotes, adminUpdateQuote } from '@/features/admin/adminApi'
import { ErrorMessage } from '@/shared/components/ErrorMessage'
import { Loading } from '@/shared/components/Loading'
import { Pagination } from '@/shared/components/Pagination'
import { useToast } from '@/shared/components/ToastProvider'

const quoteStatusOptions = ['pending', 'contacted', 'closed', 'cancelled'] as const

export function QuotesAdminPage() {
  const navigate = useNavigate()
  const { token } = useAuth()
  const { push } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()

  const page = Number(searchParams.get('page') ?? '1') || 1
  const q = searchParams.get('q') ?? ''
  const status = searchParams.get('status') ?? ''

  const [quotes, setQuotes] = useState<Quote[]>([])
  const [meta, setMeta] = useState<{ current_page: number; last_page: number } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const title = useMemo(() => (status ? `Cotizaciones (${status})` : 'Cotizaciones'), [status])

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
        const res = await adminListQuotes(token, { page, q: q.trim() || undefined, status: status || undefined })
        if (cancelled) return
        setQuotes(res.data)
        if (res.meta) setMeta({ current_page: res.meta.current_page, last_page: res.meta.last_page })
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Error cargando cotizaciones.')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [token, navigate, page, q, status])

  function setParam(key: string, value: string | null) {
    const next = new URLSearchParams(searchParams)
    if (!value) next.delete(key)
    else next.set(key, value)
    next.delete('page')
    setSearchParams(next)
  }

  if (isLoading) return <Loading />
  if (error) return <ErrorMessage message={error} />

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">{title}</h1>
          <p className="mt-1 text-sm text-slate-600">Filtra por estado o búsqueda.</p>
        </div>
        <Link to="/admin/panel" className="rounded-lg border px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
          Volver
        </Link>
      </div>

      <div className="rounded-2xl border bg-white p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div>
            <label className="text-xs font-semibold text-slate-600">Estado</label>
            <select
              className="mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:border-brand-600"
              value={status}
              onChange={(e) => setParam('status', e.target.value || null)}
            >
              <option value="">Todos</option>
              {quoteStatusOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="text-xs font-semibold text-slate-600">Búsqueda (nombre o email)</label>
            <input
              className="mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-brand-600"
              defaultValue={q}
              placeholder="Juan / juan@gmail.com"
              onKeyDown={(e) => {
                if (e.key !== 'Enter') return
                const value = (e.target as HTMLInputElement).value.trim()
                setParam('q', value || null)
              }}
            />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-slate-50 text-xs font-semibold text-slate-600">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Contacto</th>
                <th className="px-4 py-3">Producto</th>
                <th className="px-4 py-3">Cant.</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {quotes.map((qt) => (
                <tr key={qt.id} className="border-b last:border-b-0">
                  <td className="px-4 py-3 font-semibold">#{qt.id}</td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-900">{qt.contact_name}</div>
                    <div className="text-xs text-slate-600">{qt.contact_email}</div>
                    {qt.contact_phone ? <div className="text-xs text-slate-600">{qt.contact_phone}</div> : null}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-900">{qt.product?.name ?? '—'}</div>
                    <div className="text-xs text-slate-600">{qt.product?.codigo ?? ''}</div>
                  </td>
                  <td className="px-4 py-3">{qt.quantity}</td>
                  <td className="px-4 py-3">
                    <select
                      className="rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:border-brand-600"
                      value={qt.status}
                      onChange={async (e) => {
                        if (!token) return
                        const next = e.target.value
                        try {
                          const res = await adminUpdateQuote(token, qt.id, { status: next })
                          setQuotes((prev) => prev.map((x) => (x.id === qt.id ? res.quote : x)))
                          push({ type: 'success', title: 'Estado actualizado' })
                        } catch (err) {
                          push({ type: 'error', title: 'No se pudo actualizar', message: err instanceof Error ? err.message : undefined })
                        }
                      }}
                    >
                      {[qt.status, ...quoteStatusOptions].filter((v, i, arr) => arr.indexOf(v) === i).map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">
                    {qt.created_at ? new Date(qt.created_at).toLocaleString() : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <Link to={`/admin/quotes/${qt.id}`} className="text-xs font-semibold text-brand-700 hover:underline">
                      Ver detalles
                    </Link>
                  </td>
                </tr>
              ))}
              {quotes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-600">
                    No hay cotizaciones.
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
