import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { getOrder, listOrders } from '@/entities/order/api'
import type { Order } from '@/entities/order/types'
import { listPaymentMethods } from '@/entities/paymentMethod/api'
import type { PaymentMethod } from '@/entities/paymentMethod/types'
import { useAuth } from '@/features/auth/AuthContext'
import { apiUpload } from '@/shared/api/client'
import { ErrorMessage } from '@/shared/components/ErrorMessage'
import { Loading } from '@/shared/components/Loading'
import { Pagination } from '@/shared/components/Pagination'
import { useToast } from '@/shared/components/ToastProvider'

export function OrdersPage() {
  const { push } = useToast()
  const { token } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const highlightOrderId = Number(searchParams.get('order_id') ?? '0') || null
  const page = Number(searchParams.get('page') ?? '1') || 1

  const [orders, setOrders] = useState<Order[]>([])
  const [meta, setMeta] = useState<{ current_page: number; last_page: number } | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])

  const [proofFile, setProofFile] = useState<File | null>(null)
  const [trx, setTrx] = useState('')
  const [isUploading, setIsUploading] = useState(false)

  const selectedPaymentMethod = useMemo(() => {
    if (!selectedOrder) return null
    return paymentMethods.find((m) => m.id === selectedOrder.payment_method_id) ?? null
  }, [paymentMethods, selectedOrder])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const res = await listPaymentMethods()
        if (!cancelled) setPaymentMethods(res.data)
      } catch {
        // optional
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!token) {
      setIsLoading(false)
      return
    }

    let cancelled = false
    setIsLoading(true)
    setError(null)

    void (async () => {
      try {
        const result = await listOrders(token, { page })
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
  }, [token, page])

  useEffect(() => {
    if (!token || !highlightOrderId) {
      setSelectedOrder(null)
      return
    }

    let cancelled = false
    void (async () => {
      try {
        const res = await getOrder(token, highlightOrderId)
        if (!cancelled) setSelectedOrder(res.data)
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'No se pudo cargar el pedido.')
      }
    })()

    return () => {
      cancelled = true
    }
  }, [token, highlightOrderId])

  if (!token) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold">Mis pedidos</h1>
        <ErrorMessage message={`Inicia sesi\u00f3n para ver tus pedidos.`} />
        <Link to="/perfil" className="text-sm font-semibold text-brand-600 hover:underline">
          Ir a mi cuenta
        </Link>
      </div>
    )
  }

  if (isLoading) return <Loading />
  if (error) return <ErrorMessage message={error} />

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Mis pedidos</h1>

      {selectedOrder ? (
        <div className="rounded-2xl border bg-white p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-slate-900">Pedido #{selectedOrder.id}</div>
              <div className="mt-1 text-xs text-slate-500">
                Estado: <span className="font-semibold">{selectedOrder.status ?? 'pending'}</span>
              </div>
            </div>
            <div className="text-sm font-bold">S/ {selectedOrder.total_amount}</div>
          </div>

          <div className="mt-5">
            <div className="text-sm font-semibold">Productos</div>
            <div className="mt-2 space-y-2">
              {(selectedOrder.items ?? []).map((it) => (
                <div key={it.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="truncate text-slate-700">
                    {it.product?.name ?? `Producto #${it.product?.id ?? it.id}`}
                  </span>
                  <span className="text-slate-600">x{it.quantity}</span>
                </div>
              ))}
              {(selectedOrder.items ?? []).length === 0 ? (
                <div className="text-sm text-slate-600">Sin items.</div>
              ) : null}
            </div>
          </div>

          <div className="mt-6">
            <div className="text-sm font-semibold">Pago</div>
            <div className="mt-2 rounded-xl border bg-slate-50 p-4 text-sm text-slate-700">
              <div>
                Método:{' '}
                <span className="font-semibold">
                  {selectedPaymentMethod?.name ?? `#${selectedOrder.payment_method_id}`}
                </span>
              </div>
              {selectedPaymentMethod?.instructions ? (
                <div className="mt-2 whitespace-pre-wrap text-xs text-slate-600">
                  {selectedPaymentMethod.instructions}
                </div>
              ) : null}
            </div>
          </div>

          <div className="mt-6">
            <div className="text-sm font-semibold">Comprobantes</div>
            <div className="mt-2 space-y-2">
              {(selectedOrder.payments ?? []).map((p) => (
                <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3 text-sm">
                  <div>
                    <div className="font-semibold text-slate-900">Pago #{p.id}</div>
                    <div className="text-xs text-slate-600">Estado: {p.status}</div>
                  </div>
                  {p.proof_url ? (
                    <a
                      href={p.proof_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-semibold text-brand-700 hover:underline"
                    >
                      Ver archivo
                    </a>
                  ) : (
                    <div className="text-xs text-slate-600">Sin archivo</div>
                  )}
                </div>
              ))}
              {(selectedOrder.payments ?? []).length === 0 ? (
                <div className="text-sm text-slate-600">{`A\u00fan no hay pagos registrados.`}</div>
              ) : null}
            </div>
          </div>

          <div className="mt-6">
            <div className="text-sm font-semibold">Subir comprobante</div>
            <p className="mt-1 text-xs text-slate-500">{`Adjunta una imagen o PDF del pago. Luego el admin lo validar\u00e1.`}</p>

            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label className="text-xs font-semibold text-slate-600">Referencia (opcional)</label>
                <input
                  className="mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-brand-600"
                  value={trx}
                  onChange={(e) => setTrx(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">Archivo</label>
                <input
                  className="mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm"
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,.pdf"
                  onChange={(e) => setProofFile(e.target.files?.[0] ?? null)}
                />
              </div>
            </div>

            <button
              className="mt-4 rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
              disabled={!proofFile || isUploading}
              onClick={async () => {
                if (!token || !proofFile) return
                setIsUploading(true)
                try {
                  const fd = new FormData()
                  fd.append('proof', proofFile)
                  fd.append('payment_method_id', String(selectedOrder.payment_method_id))
                  if (trx.trim()) fd.append('transaction_reference', trx.trim())

                  await apiUpload(`/orders/${selectedOrder.id}/payment-proof`, fd, {
                    Authorization: `Bearer ${token}`,
                  })

                  push({ type: 'success', title: 'Comprobante enviado' })
                  setProofFile(null)
                  setTrx('')
                  const updated = await getOrder(token, selectedOrder.id, { cache: false })
                  setSelectedOrder(updated.data)
                } catch (e) {
                  push({ type: 'error', title: 'Error subiendo comprobante', message: e instanceof Error ? e.message : undefined })
                } finally {
                  setIsUploading(false)
                }
              }}
            >
              {isUploading ? 'Subiendo...' : 'Enviar comprobante'}
            </button>

            <div className="mt-4">
              <Link to="/mis-pedidos" className="text-sm font-semibold text-brand-700 hover:underline" onClick={() => setSearchParams(new URLSearchParams())}>
                Volver a la lista
              </Link>
            </div>
          </div>
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-2xl border bg-white p-6 text-sm text-slate-600">{`A\u00fan no tienes pedidos.`}</div>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <div key={o.id} className="rounded-2xl border bg-white p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-900">Pedido #{o.id}</div>
                  <div className="mt-1 text-xs text-slate-500">
                    Estado: <span className="font-semibold">{o.status ?? 'pending'}</span>
                  </div>
                </div>
                <div className="text-sm font-bold">S/ {o.total_amount}</div>
              </div>

              <div className="mt-4">
                <Link to={`/mis-pedidos?order_id=${o.id}`} className="text-xs font-semibold text-brand-700 hover:underline">
                  Ver detalle / subir comprobante
                </Link>
              </div>
            </div>
          ))}
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
      )}
    </div>
  )
}
