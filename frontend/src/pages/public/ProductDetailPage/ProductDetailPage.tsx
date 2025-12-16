import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getProduct } from '@/entities/product/api'
import type { Product } from '@/entities/product/types'
import { useCart } from '@/features/cart/CartContext'
import { ErrorMessage } from '@/shared/components/ErrorMessage'
import { Loading } from '@/shared/components/Loading'

export function ProductDetailPage() {
  const { id } = useParams()
  const productId = Number(id ?? '0') || null
  const { add, isLoading: cartLoading } = useCart()

  const [product, setProduct] = useState<Product | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!productId) {
      setIsLoading(false)
      setError('Producto inválido.')
      return
    }

    let cancelled = false
    setIsLoading(true)
    setError(null)

    void (async () => {
      try {
        const result = await getProduct(productId)
        if (!cancelled) setProduct(result.data)
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Error cargando producto.')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [productId])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold">Producto</h1>
        <Link
          to="/productos"
          className="rounded-lg border px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Volver a productos
        </Link>
      </div>

      {isLoading ? <Loading /> : null}
      {error ? <ErrorMessage message={error} /> : null}

      {product ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="aspect-[4/3] overflow-hidden rounded-2xl border bg-slate-100">
            {product.images?.[0]?.url ? (
              <img src={product.images[0].url ?? ''} alt={product.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm text-slate-500">Sin imagen</div>
            )}
          </div>
          <div className="rounded-2xl border bg-white p-6">
            <div className="text-xs font-semibold text-slate-500">{product.codigo}</div>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">{product.name}</h2>
            <div className="mt-3 text-sm text-slate-600">{product.description ?? '—'}</div>
            <div className="mt-5 flex items-center justify-between">
              <div className="text-2xl font-extrabold text-slate-900">S/ {product.price}</div>
              <div className="text-sm text-slate-600">
                Stock: <span className="font-semibold">{product.stock_quantity}</span>
              </div>
            </div>
            <button
              className="mt-6 w-full rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
              disabled={cartLoading || product.status !== 'active'}
              onClick={() => add(product.id, 1)}
            >
              Agregar al carrito
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
