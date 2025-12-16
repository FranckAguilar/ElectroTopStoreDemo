import { useEffect, useMemo, useRef } from 'react'
import { Link } from 'react-router-dom'
import type { Product } from '@/entities/product/types'
import { useCart } from '@/features/cart/CartContext'

type Props = {
  title: string
  products: Product[]
  speedPxPerSecond?: number
}

export function ProductCarousel({ title, products, speedPxPerSecond = 35 }: Props) {
  const { add, isLoading: cartLoading } = useCart()

  const baseProducts = useMemo(() => {
    if (products.length === 0) return []

    const minUniqueForLoop = 4
    if (products.length < minUniqueForLoop) return products

    const minBaseItems = 20
    const base: Product[] = []
    while (base.length < minBaseItems) base.push(...products)
    return base
  }, [products])

  const trackRef = useRef<HTMLDivElement | null>(null)
  const metricsRef = useRef<{ half: number }>({ half: 0 })

  useEffect(() => {
    if (products.length < 4) return
    if (baseProducts.length === 0) return

    const track = trackRef.current
    if (!track) return
    const trackEl = track

    let raf = 0
    let last = performance.now()
    let offset = 0

    const updateMetrics = () => {
      metricsRef.current.half = trackEl.scrollWidth / 2
    }

    updateMetrics()
    const ro = new ResizeObserver(updateMetrics)
    ro.observe(trackEl)

    function tick(now: number) {
      const dt = Math.min(now - last, 48)
      last = now

      const half = metricsRef.current.half
      if (half > 0) {
        offset += (speedPxPerSecond * dt) / 1000
        if (offset >= half) offset -= half
        trackEl.style.transform = `translate3d(${-offset}px, 0, 0)`
      }

      raf = window.requestAnimationFrame(tick)
    }

    offset = 0
    trackEl.style.transform = 'translate3d(0, 0, 0)'
    const cleanupTrack = trackEl

    raf = window.requestAnimationFrame(tick)

    return () => {
      ro.disconnect()
      window.cancelAnimationFrame(raf)
      cleanupTrack.style.transform = 'translate3d(0, 0, 0)'
    }
  }, [products.length, baseProducts.length, speedPxPerSecond])

  const loopProducts = useMemo(() => {
    if (baseProducts.length === 0) return []
    if (products.length < 4) return baseProducts
    return [...baseProducts, ...baseProducts]
  }, [baseProducts, products.length])

  return (
    <section className="space-y-3">
      <div className="grid grid-cols-[1fr,auto,1fr] items-center gap-4 px-2 sm:px-4">
        <div />
        <h2 className="text-center text-sm font-extrabold tracking-widest text-slate-900 sm:text-base">
          {title.toUpperCase()}
        </h2>
        <div className="flex justify-end">
          <Link to="/productos" className="text-sm font-semibold text-brand-600 hover:text-brand-700">
            Ver todo
          </Link>
        </div>
      </div>

      <div className="relative overflow-hidden py-4">
        <div ref={trackRef} className="flex w-max gap-6 px-2 sm:px-4 will-change-transform">
          {loopProducts.map((p, index) => {
            const img = p.images?.[0]?.url ?? null
            const subtitle = p.description ?? p.name
            return (
              <div
                key={`${p.id}-${index}`}
                className="flex h-[320px] w-[220px] min-w-[220px] flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <Link to={`/productos/${p.id}`} className="flex min-h-0 flex-1 flex-col overflow-hidden p-4">
                  <div className="flex h-[150px] w-full items-center justify-center rounded-xl bg-white">
                    {img ? (
                      <img
                        src={img}
                        alt={p.name}
                        loading="lazy"
                        decoding="async"
                        className="h-[130px] w-full object-contain"
                      />
                    ) : (
                      <div className="text-xs text-slate-400">Sin imagen</div>
                    )}
                  </div>
                  <div className="mt-4 min-h-0 space-y-1">
                    <div className="truncate text-sm font-bold text-slate-900">{p.name}</div>
                    <div className="text-xs text-slate-600 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] overflow-hidden">
                      {subtitle}
                    </div>
                    <div className="pt-2 text-sm font-extrabold text-brand-600">S/ {p.price}</div>
                  </div>
                </Link>

                <div className="px-4 pb-4 pt-3">
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
      </div>
    </section>
  )
}
