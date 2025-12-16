import { useEffect, useMemo, useState } from 'react'
import { listProducts } from '@/entities/product/api'
import type { Product } from '@/entities/product/types'
import { submitQuote } from '@/entities/quote/api'
import { useSettings } from '@/features/settings/SettingsContext'
import { ErrorMessage } from '@/shared/components/ErrorMessage'
import { useToast } from '@/shared/components/ToastProvider'

export function ContactPage() {
  const { push } = useToast()
  const { get } = useSettings()

  const storePhone = get('store.phone', '+51 987 654 321')
  const storeEmail = get('store.email', 'ventas@electrotop.pe')
  const storeAddress = get('store.address', '')
  const whatsapp = get('store.whatsapp', '')

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [quantity, setQuantity] = useState<number>(1)

  const [productQuery, setProductQuery] = useState('')
  const [productResults, setProductResults] = useState<Product[]>([])
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSubmit = useMemo(() => {
    return (
      !!name.trim() &&
      !!email.trim() &&
      !!selectedProduct?.id &&
      quantity >= 1 &&
      !isLoading
    )
  }, [name, email, selectedProduct?.id, quantity, isLoading])

  useEffect(() => {
    const q = productQuery.trim()
    setSearchError(null)
    if (!q) {
      setProductResults([])
      return
    }

    const t = window.setTimeout(() => {
      let cancelled = false
      setIsSearching(true)
      void (async () => {
        try {
          const res = await listProducts({ q, per_page: 8, page: 1 })
          if (cancelled) return
          setProductResults(res.data)
        } catch (e) {
          if (!cancelled) setSearchError(e instanceof Error ? e.message : 'Error buscando productos.')
        } finally {
          if (!cancelled) setIsSearching(false)
        }
      })()
      return () => {
        cancelled = true
      }
    }, 300)

    return () => window.clearTimeout(t)
  }, [productQuery])

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Contacto</h1>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border bg-white p-6">
          <div className="text-sm font-semibold">Datos</div>
          <div className="mt-3 space-y-2 text-sm text-slate-700">
            <div>
              <div className="text-xs font-semibold text-slate-600">Teléfono</div>
              <div>{storePhone}</div>
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-600">Email</div>
              <div>{storeEmail}</div>
            </div>
            {storeAddress ? (
              <div>
                <div className="text-xs font-semibold text-slate-600">Dirección</div>
                <div>{storeAddress}</div>
              </div>
            ) : null}
            {whatsapp ? (
              <a
                className="inline-flex rounded-lg border px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                href={`https://wa.me/${whatsapp.replace(/[^\d]/g, '')}`}
                target="_blank"
                rel="noreferrer"
              >
                WhatsApp
              </a>
            ) : null}
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-6 lg:col-span-2">
          <p className="text-sm text-slate-600">
            Envíanos una cotización. Selecciona el producto por búsqueda y completa tus datos.
          </p>

          {error ? (
            <div className="mt-4">
              <ErrorMessage message={error} />
            </div>
          ) : null}

          <form
            className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2"
            onSubmit={async (e) => {
              e.preventDefault()
              if (!selectedProduct) return
              setIsLoading(true)
              setError(null)
              try {
                await submitQuote({
                  contact_name: name.trim(),
                  contact_email: email.trim(),
                  contact_phone: phone.trim() || undefined,
                  product_id: selectedProduct.id,
                  quantity,
                  message: message.trim() || undefined,
                })
                push({ type: 'success', title: 'Cotización enviada', message: 'Te contactaremos pronto.' })
                setMessage('')
                setQuantity(1)
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Error enviando cotización.')
                push({ type: 'error', title: 'Error enviando cotización', message: err instanceof Error ? err.message : undefined })
              } finally {
                setIsLoading(false)
              }
            }}
          >
            <div>
              <label className="text-xs font-semibold text-slate-600">Nombre</label>
              <input
                className="mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-brand-600"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600">Email</label>
              <input
                className="mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-brand-600"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600">Teléfono (opcional)</label>
              <input
                className="mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-brand-600"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-600">Cantidad</label>
                <input
                  className="mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-brand-600"
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  required
                />
              </div>
              <div />
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-slate-600">Producto</label>
              <div className="mt-1">
                <input
                  className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-brand-600"
                  placeholder="Buscar por nombre o código..."
                  value={productQuery}
                  onChange={(e) => {
                    setProductQuery(e.target.value)
                    setSelectedProduct(null)
                  }}
                />
              </div>

              {isSearching ? <div className="mt-2 text-xs text-slate-600">Buscando...</div> : null}
              {searchError ? <div className="mt-2"><ErrorMessage message={searchError} /></div> : null}

              {!selectedProduct && productResults.length > 0 ? (
                <div className="mt-2 overflow-hidden rounded-xl border">
                  {productResults.map((p) => (
                    <button
                      type="button"
                      key={p.id}
                      className="flex w-full items-center justify-between gap-3 border-b px-3 py-2 text-left text-sm hover:bg-slate-50 last:border-b-0"
                      onClick={() => {
                        setSelectedProduct(p)
                        setProductQuery(`${p.name} (${p.codigo})`)
                        setProductResults([])
                      }}
                    >
                      <span className="font-semibold text-slate-900">{p.name}</span>
                      <span className="text-xs text-slate-600">{p.codigo}</span>
                    </button>
                  ))}
                </div>
              ) : null}

              {selectedProduct ? (
                <div className="mt-2 rounded-xl border bg-slate-50 p-3 text-sm text-slate-700">
                  Seleccionado: <span className="font-semibold">{selectedProduct.name}</span>{' '}
                  <span className="text-xs text-slate-600">({selectedProduct.codigo})</span>
                </div>
              ) : null}
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-slate-600">Mensaje (opcional)</label>
              <textarea
                className="mt-1 min-h-28 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-brand-600"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>

            <div className="md:col-span-2">
              <button
                type="submit"
                className="w-full rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
                disabled={!canSubmit}
              >
                {isLoading ? 'Enviando...' : 'Enviar cotización'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

