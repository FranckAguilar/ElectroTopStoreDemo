import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { listBrands } from '@/entities/brand/api'
import type { Brand } from '@/entities/brand/types'
import { listCategories } from '@/entities/category/api'
import type { Category } from '@/entities/category/types'
import { listProducts } from '@/entities/product/api'
import type { Product } from '@/entities/product/types'
import { useCart } from '@/features/cart/CartContext'
import { ErrorMessage } from '@/shared/components/ErrorMessage'
import { Loading } from '@/shared/components/Loading'
import { Pagination } from '@/shared/components/Pagination'

function byIdAsc<T extends { id: number }>(a: T, b: T) {
  return a.id - b.id
}

export function ProductsPage() {
  const { add, isLoading: cartLoading } = useCart()
  const [searchParams, setSearchParams] = useSearchParams()
  const q = searchParams.get('q') ?? undefined
  const page = Number(searchParams.get('page') ?? '1') || 1
  const categoryId = Number(searchParams.get('category_id') ?? '0') || undefined
  const brandId = Number(searchParams.get('brand_id') ?? '0') || undefined

  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [meta, setMeta] = useState<{ current_page: number; last_page: number } | null>(null)

  const selectedCategory = useMemo(
    () => (categoryId ? categories.find((c) => c.id === categoryId) ?? null : null),
    [categories, categoryId],
  )
  const selectedBrand = useMemo(
    () => (brandId ? brands.find((b) => b.id === brandId) ?? null : null),
    [brands, brandId],
  )

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    setError(null)

    void (async () => {
      try {
        const result = await listProducts({ q, category_id: categoryId, brand_id: brandId, per_page: 20, page })
        if (!cancelled) setProducts(result.data)
        if (!cancelled && result.meta) {
          setMeta({ current_page: result.meta.current_page, last_page: result.meta.last_page })
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Error cargando productos.')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [q, categoryId, brandId, page])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const [cats, brs] = await Promise.all([listCategories(), listBrands()])
        if (!cancelled) {
          setCategories(cats.data.slice().sort(byIdAsc))
          setBrands(brs.data.slice().sort(byIdAsc))
        }
      } catch {
        // ignore, filters are optional
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  function updateParam(key: string, value: string | null) {
    const next = new URLSearchParams(searchParams)
    if (!value) next.delete(key)
    else next.set(key, value)
    next.delete('page')
    setSearchParams(next)
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[300px,1fr,300px]">
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <div className="pb-3 text-center text-sm font-extrabold tracking-widest text-slate-900">
              {`CATEGOR\u00cdAS`}
            </div>
            <div className="space-y-2">
              {categories.map((c) => {
                const active = c.id === categoryId
                return (
                  <button
                    key={c.id}
                    className={[
                      'w-full rounded-md px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-white transition',
                      active ? 'bg-sky-700' : 'bg-sky-500 hover:bg-sky-600',
                    ].join(' ')}
                    onClick={() => updateParam('category_id', active ? null : String(c.id))}
                  >
                    {c.name}
                  </button>
                )
              })}

              <button
                className="mt-2 w-full rounded-md bg-sky-600 px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-white hover:bg-sky-700"
                onClick={() => setSearchParams(new URLSearchParams())}
              >
                {`Ver todos los productos`}
              </button>
            </div>
          </div>
        </aside>

        <main className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-lg font-semibold text-slate-900">Productos</h1>
            {q || categoryId || brandId ? (
              <button
                className="rounded-xl border px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                onClick={() => setSearchParams(new URLSearchParams())}
              >
                Limpiar filtros
              </button>
            ) : null}
          </div>

          {q || selectedCategory || selectedBrand ? (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {q ? (
                <button
                  className="inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1 font-semibold text-slate-700 hover:bg-slate-50"
                  onClick={() => updateParam('q', null)}
                  title="Quitar búsqueda"
                >
                  <span>{`B\u00fasqueda: ${q}`}</span>
                  <span className="text-slate-400">×</span>
                </button>
              ) : null}
              {selectedCategory ? (
                <button
                  className="inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1 font-semibold text-slate-700 hover:bg-slate-50"
                  onClick={() => updateParam('category_id', null)}
                  title="Quitar categoría"
                >
                  <span>{selectedCategory.name}</span>
                  <span className="text-slate-400">×</span>
                </button>
              ) : null}
              {selectedBrand ? (
                <button
                  className="inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1 font-semibold text-slate-700 hover:bg-slate-50"
                  onClick={() => updateParam('brand_id', null)}
                  title="Quitar marca"
                >
                  <span>{selectedBrand.name}</span>
                  <span className="text-slate-400">×</span>
                </button>
              ) : null}
            </div>
          ) : null}

          {isLoading ? <Loading /> : null}
          {error ? <ErrorMessage message={error} /> : null}

          {!isLoading && !error ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {products.map((p) => {
                  const img = p.images?.[0]?.url ?? null
                  const subtitle = p.description ?? ''
                  return (
                    <div key={p.id} className="rounded-xl border bg-white p-4 shadow-sm">
                      <Link to={`/productos/${p.id}`} className="block">
                        <div className="flex h-36 items-center justify-center rounded-lg bg-white">
                          {img ? (
                            <img
                              src={img}
                              alt={p.name}
                              loading="lazy"
                              decoding="async"
                              className="h-28 w-full object-contain"
                            />
                          ) : (
                            <div className="text-xs text-slate-400">Sin imagen</div>
                          )}
                        </div>
                        <div className="mt-3 space-y-1 text-center">
                          <div className="text-xs font-bold text-slate-900">{p.name}</div>
                          <div className="mx-auto min-h-8 text-[11px] text-slate-500 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] overflow-hidden">
                            {subtitle}
                          </div>
                          <div className="text-xs font-semibold text-sky-600">{`Precio: S/ ${p.price}`}</div>
                        </div>
                      </Link>

                      <div className="mt-3 flex justify-center">
                        <button
                          className="w-full rounded-xl bg-brand-600 px-3 py-2 text-xs font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
                          disabled={cartLoading || p.status !== 'active'}
                          onClick={() => add(p.id, 1)}
                        >
                          Agregar
                        </button>
                      </div>
                    </div>
                  )
                })}
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
          ) : null}
        </main>

        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <div className="pb-3 text-center text-sm font-extrabold tracking-widest text-slate-900">{`MARCAS`}</div>
            <div className="space-y-2">
              {brands.map((b) => {
                const active = b.id === brandId
                return (
                  <button
                    key={b.id}
                    className={[
                      'flex w-full items-center justify-center rounded-xl px-3 py-3 transition hover:bg-slate-50',
                      active ? 'bg-slate-50 ring-2 ring-brand-600' : '',
                    ].join(' ')}
                    onClick={() => updateParam('brand_id', active ? null : String(b.id))}
                    title={b.name}
                  >
                    {b.logo_url ? (
                      <img
                        src={b.logo_url}
                        alt={b.name}
                        loading="lazy"
                        decoding="async"
                        className="h-10 w-[180px] object-contain"
                      />
                    ) : (
                      <span className="text-xs font-semibold text-slate-600">{b.name}</span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
