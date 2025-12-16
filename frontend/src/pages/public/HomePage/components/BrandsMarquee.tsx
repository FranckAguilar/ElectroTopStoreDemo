import { useEffect, useMemo, useRef, useState } from 'react'
import type { Brand } from '@/entities/brand/types'
import { listBrands } from '@/entities/brand/api'

export function BrandsMarquee() {
  const [brands, setBrands] = useState<Brand[]>([])
  const trackRef = useRef<HTMLDivElement | null>(null)
  const metricsRef = useRef<{ half: number }>({ half: 0 })

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const res = await listBrands()
        if (!cancelled) setBrands(res.data)
      } catch {
        if (!cancelled) setBrands([])
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  const baseBrands = useMemo(() => {
    if (brands.length === 0) return []
    const minBaseItems = 12
    const repeats = Math.max(1, Math.ceil(minBaseItems / brands.length))
    const base: Brand[] = []
    for (let i = 0; i < repeats; i++) base.push(...brands)
    return base
  }, [brands])

  const loopBrands = useMemo(() => {
    if (baseBrands.length === 0) return []
    return [...baseBrands, ...baseBrands]
  }, [baseBrands])

  useEffect(() => {
    if (loopBrands.length === 0) return

    let raf = 0
    let last = performance.now()
    const speedPxPerSecond = 12
    let offset = 0

    const track = trackRef.current
    if (!track) return
    const trackEl: HTMLDivElement = track

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
      if (cleanupTrack) cleanupTrack.style.transform = 'translate3d(0, 0, 0)'
    }
  }, [loopBrands.length])

  if (brands.length === 0) return null

  return (
    <section>
      <div className="relative overflow-hidden rounded-2xl bg-white py-8">
        <div className="pointer-events-none absolute inset-0 opacity-30">
          <svg
            className="absolute left-1/2 top-[-220px] h-[700px] w-[700px] -translate-x-1/2 text-slate-100"
            viewBox="0 0 700 700"
            fill="none"
            aria-hidden="true"
          >
            <circle cx="350" cy="350" r="140" stroke="currentColor" strokeWidth="1" />
            <circle cx="350" cy="350" r="240" stroke="currentColor" strokeWidth="1" />
            <circle cx="350" cy="350" r="340" stroke="currentColor" strokeWidth="1" />
          </svg>
        </div>

        <div className="relative">
          <p className="pb-8 text-center text-sm font-medium text-slate-400">
            {`Con la confianza de marcas l\u00edderes, incluyendo \u2014`}
          </p>

          <div className="relative z-0 mx-auto w-full max-w-4xl overflow-hidden">
            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-white via-white/90 to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-white via-white/90 to-transparent" />

            <div ref={trackRef} className="flex w-max items-center gap-20 px-10 py-2 will-change-transform">
              {loopBrands.map((b, idx) => (
                <div key={`${b.id}-${idx}`} className="flex items-center justify-center">
                  {b.logo_url ? (
                    <img
                      src={b.logo_url}
                      alt={b.name}
                      className="h-8 w-[120px] select-none object-contain opacity-60 grayscale"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-[120px] rounded-full border bg-slate-50 px-4 py-2 text-center text-sm font-semibold text-slate-500">
                      {b.name}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
