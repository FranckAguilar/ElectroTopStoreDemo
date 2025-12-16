import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/AuthContext'
import type { AdminProduct } from '@/features/admin/adminApi'
import { adminGetHomeConfig, adminListProducts, adminUpdateHomeConfig } from '@/features/admin/adminApi'
import { ErrorMessage } from '@/shared/components/ErrorMessage'
import { Loading } from '@/shared/components/Loading'
import { useToast } from '@/shared/components/ToastProvider'

type ConfigState = {
  recommendedIds: number[]
  recommendedProducts: AdminProduct[]
  bestSellersDays: number
  bestSellersLimit: number
}

const MAX_RECOMMENDED = 50

function move<T>(list: T[], from: number, to: number): T[] {
  const next = list.slice()
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}

export function HomeAdminPage() {
  const navigate = useNavigate()
  const { token } = useAuth()
  const { push } = useToast()

  const [config, setConfig] = useState<ConfigState | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState<AdminProduct[]>([])
  const [searchLoading, setSearchLoading] = useState(false)

  const recommendedById = useMemo(() => {
    const map = new Map<number, AdminProduct>()
    for (const p of config?.recommendedProducts ?? []) map.set(p.id, p)
    return map
  }, [config?.recommendedProducts])

  const orderedRecommended = useMemo(() => {
    if (!config) return []
    return config.recommendedIds
      .map((id) => recommendedById.get(id))
      .filter((p): p is AdminProduct => Boolean(p))
  }, [config, recommendedById])

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
        const res = await adminGetHomeConfig(token)
        if (cancelled) return
        setConfig({
          recommendedIds: res.recommended_product_ids,
          recommendedProducts: res.recommended_products.data,
          bestSellersDays: res.best_sellers_days,
          bestSellersLimit: res.best_sellers_limit,
        })
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : `Error cargando configuraci\u00f3n de inicio.`)
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [token, navigate])

  useEffect(() => {
    if (!token) return
    const q = search.trim()
    if (!q) {
      setSearchResults([])
      return
    }

    let cancelled = false
    setSearchLoading(true)

    const t = setTimeout(() => {
      void (async () => {
        try {
          const res = await adminListProducts(token, { q, page: 1 })
          if (!cancelled) setSearchResults(res.data.slice(0, 10))
        } catch {
          if (!cancelled) setSearchResults([])
        } finally {
          if (!cancelled) setSearchLoading(false)
        }
      })()
    }, 250)

    return () => {
      cancelled = true
      clearTimeout(t)
    }
  }, [token, search])

  if (isLoading) return <Loading />
  if (error) return <ErrorMessage message={error} />
  if (!config) return <ErrorMessage message={`No hay configuraci\u00f3n.`} />

  async function save() {
    if (!token || !config) return
    try {
      const cfg = config
      const res = await adminUpdateHomeConfig(token, {
        recommended_product_ids: cfg.recommendedIds,
        best_sellers_days: cfg.bestSellersDays,
        best_sellers_limit: cfg.bestSellersLimit,
      })

      setConfig({
        recommendedIds: res.recommended_product_ids,
        recommendedProducts: res.recommended_products.data,
        bestSellersDays: res.best_sellers_days,
        bestSellersLimit: res.best_sellers_limit,
      })

      push({ type: 'success', title: 'Inicio actualizado' })
    } catch (e) {
      push({ type: 'error', title: 'No se pudo guardar', message: e instanceof Error ? e.message : undefined })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Inicio (Carruseles)</h1>
          <p className="mt-1 text-sm text-slate-600">
            {`Recomendados: manual. M\u00e1s vendidos: autom\u00e1tico (\u00f3rdenes pagadas / enviadas / entregadas).`}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {`Tip: con 1\u20133 productos el carrusel no se mueve para evitar repetici\u00f3n visual. En M\u00e1s vendidos, sube el l\u00edmite (8\u201312) para ver m\u00e1s items.`}
          </p>
        </div>
        <button
          className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          onClick={() => void save()}
        >
          Guardar
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border bg-white p-6 lg:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-semibold">Recomendados (manual)</div>
            <div className="text-xs text-slate-500">
              {config.recommendedIds.length}/{MAX_RECOMMENDED}
            </div>
          </div>

          {config.recommendedIds.length === 0 ? (
            <div className="mt-4 rounded-xl border bg-slate-50 p-4 text-sm text-slate-600">
              {`A\u00fan no hay recomendados. Usa la b\u00fasqueda para agregar productos.`}
            </div>
          ) : (
            <div className="mt-4 space-y-2">
              {orderedRecommended.map((p, idx) => (
                <div key={p.id} className="flex items-center justify-between gap-3 rounded-xl border px-4 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    {p.images?.[0]?.url ? (
                      <img
                        src={p.images[0].url}
                        alt={p.name}
                        loading="lazy"
                        decoding="async"
                        className="h-10 w-10 shrink-0 rounded-lg border bg-white object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 shrink-0 rounded-lg border bg-slate-50" aria-hidden="true" />
                    )}
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-slate-900">{p.codigo}</div>
                      <div className="truncate text-xs text-slate-600">{p.name}</div>
                      <div className="pt-0.5 text-xs font-semibold text-slate-900">S/ {p.price}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      className="rounded-lg border px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                      disabled={idx === 0}
                      aria-label="Subir"
                      onClick={() =>
                        setConfig((prev) =>
                          prev
                            ? { ...prev, recommendedIds: move(prev.recommendedIds, idx, Math.max(0, idx - 1)) }
                            : prev,
                        )
                      }
                    >
                      {`\u2191`}
                    </button>
                    <button
                      className="rounded-lg border px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                      disabled={idx === config.recommendedIds.length - 1}
                      aria-label="Bajar"
                      onClick={() =>
                        setConfig((prev) =>
                          prev
                            ? {
                                ...prev,
                                recommendedIds: move(
                                  prev.recommendedIds,
                                  idx,
                                  Math.min(prev.recommendedIds.length - 1, idx + 1),
                                ),
                              }
                            : prev,
                        )
                      }
                    >
                      {`\u2193`}
                    </button>
                    <button
                      className="rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                      onClick={() =>
                        setConfig((prev) =>
                          prev ? { ...prev, recommendedIds: prev.recommendedIds.filter((id) => id !== p.id) } : prev,
                        )
                      }
                    >
                      Quitar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 border-t pt-6">
            <div className="text-sm font-semibold">{`M\u00e1s vendidos (autom\u00e1tico)`}</div>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold text-slate-600">{`D\u00edas (rango)`}</label>
                <input
                  className="mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-brand-600"
                  type="number"
                  min={1}
                  max={365}
                  value={config.bestSellersDays}
                  onChange={(e) =>
                    setConfig((prev) => (prev ? { ...prev, bestSellersDays: Number(e.target.value) } : prev))
                  }
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">{`L\u00edmite`}</label>
                <input
                  className="mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-brand-600"
                  type="number"
                  min={1}
                  max={50}
                  value={config.bestSellersLimit}
                  onChange={(e) =>
                    setConfig((prev) => (prev ? { ...prev, bestSellersLimit: Number(e.target.value) } : prev))
                  }
                />
                <div className="mt-1 text-[11px] text-slate-500">{`Sugerido: 8\u201312`}</div>
              </div>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              {`Se calcula con las cantidades vendidas en \u00f3rdenes con estado paid/shipped/delivered dentro del rango.`}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-6">
          <div className="text-sm font-semibold">Agregar recomendados</div>
          <div className="mt-3">
            <label className="text-xs font-semibold text-slate-600">Buscar producto</label>
            <input
              className="mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-brand-600"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Nombre o c\u00f3digo\u2026`}
            />
          </div>

          {searchLoading ? <div className="mt-4 text-sm text-slate-600">{`Buscando\u2026`}</div> : null}

          <div className="mt-4 space-y-2">
            {search.trim() && !searchLoading && searchResults.length === 0 ? (
              <div className="text-sm text-slate-600">Sin resultados.</div>
            ) : null}

            {searchResults.map((p) => {
              const already = config.recommendedIds.includes(p.id)
              const canAdd = p.status === 'active' && !already && config.recommendedIds.length < MAX_RECOMMENDED
              const img = p.images?.[0]?.url ?? null

              return (
                <div key={p.id} className="flex items-center justify-between gap-3 rounded-xl border px-3 py-2">
                  <div className="flex min-w-0 items-center gap-3">
                    {img ? (
                      <img
                        src={img}
                        alt={p.name}
                        loading="lazy"
                        decoding="async"
                        className="h-9 w-9 shrink-0 rounded-lg border bg-white object-cover"
                      />
                    ) : (
                      <div className="h-9 w-9 shrink-0 rounded-lg border bg-slate-50" aria-hidden="true" />
                    )}
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold">{p.codigo}</div>
                      <div className="truncate text-xs text-slate-600">{p.name}</div>
                      <div className="pt-0.5 text-xs font-semibold text-slate-900">S/ {p.price}</div>
                      {p.status !== 'active' ? (
                        <div className="pt-0.5 text-xs font-semibold text-rose-600">{`Inactivo`}</div>
                      ) : null}
                    </div>
                  </div>
                  <button
                    className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
                    disabled={!canAdd}
                    onClick={() => {
                      setConfig((prev) => {
                        if (!prev) return prev
                        if (prev.recommendedIds.includes(p.id)) return prev
                        if (prev.recommendedIds.length >= MAX_RECOMMENDED) return prev
                        if (p.status !== 'active') return prev

                        const nextProducts = prev.recommendedProducts.some((x) => x.id === p.id)
                          ? prev.recommendedProducts
                          : [p, ...prev.recommendedProducts]

                        return { ...prev, recommendedIds: [...prev.recommendedIds, p.id], recommendedProducts: nextProducts }
                      })
                    }}
                  >
                    {already ? 'Agregado' : 'Agregar'}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
