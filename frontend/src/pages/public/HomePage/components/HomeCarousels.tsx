import { useEffect, useState } from 'react'
import { getHomeBestSellers, getHomeRecommended } from '@/entities/home/api'
import type { Product } from '@/entities/product/types'
import { ErrorMessage } from '@/shared/components/ErrorMessage'
import { Loading } from '@/shared/components/Loading'
import { ProductCarousel } from './ProductCarousel'

type State = {
  recommended: Product[]
  bestSellers: Product[]
  isLoading: boolean
  error: string | null
}

export function HomeCarousels() {
  const [state, setState] = useState<State>({
    recommended: [],
    bestSellers: [],
    isLoading: true,
    error: null,
  })

  useEffect(() => {
    let cancelled = false
    setState((s) => ({ ...s, isLoading: true, error: null }))

    void (async () => {
      try {
        const [recommended, bestSellers] = await Promise.all([getHomeRecommended(), getHomeBestSellers()])

        if (!cancelled) {
          setState({
            recommended: recommended.data,
            bestSellers: bestSellers.data,
            isLoading: false,
            error: null,
          })
        }
      } catch (e) {
        if (!cancelled) {
          setState((s) => ({
            ...s,
            isLoading: false,
            error: e instanceof Error ? e.message : 'Error cargando productos.',
          }))
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  if (state.isLoading) return <Loading />
  if (state.error) return <ErrorMessage message={state.error} />

  if (state.recommended.length === 0 && state.bestSellers.length === 0) {
    return (
      <div className="px-4 py-6 text-center text-sm text-slate-600">
        {`A\u00fan no hay productos para mostrar.`}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {state.recommended.length ? (
        <ProductCarousel title="Recomendados" products={state.recommended} speedPxPerSecond={35} />
      ) : null}

      {state.bestSellers.length ? (
        <ProductCarousel title={`M\u00e1s vendidos`} products={state.bestSellers} speedPxPerSecond={35} />
      ) : null}
    </div>
  )
}
