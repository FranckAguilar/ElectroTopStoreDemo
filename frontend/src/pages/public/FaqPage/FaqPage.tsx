import { useEffect, useState } from 'react'
import { listFaqs } from '@/entities/faq/api'
import type { Faq } from '@/entities/faq/types'
import { ErrorMessage } from '@/shared/components/ErrorMessage'
import { Loading } from '@/shared/components/Loading'

export function FaqPage() {
  const [faqs, setFaqs] = useState<Faq[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    setError(null)

    void (async () => {
      try {
        const result = await listFaqs()
        if (!cancelled) setFaqs(result.data)
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Error cargando FAQs.')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">FAQs</h1>
      {isLoading ? <Loading /> : null}
      {error ? <ErrorMessage message={error} /> : null}

      {!isLoading && !error ? (
        <div className="space-y-3">
          {faqs.length === 0 ? (
            <div className="rounded-2xl border bg-white p-6 text-sm text-slate-600">{`No hay FAQs a\u00fan.`}</div>
          ) : (
            faqs.map((f) => (
              <details key={f.id} className="rounded-2xl border bg-white p-4">
                <summary className="cursor-pointer text-sm font-semibold text-slate-900">{f.question}</summary>
                <div className="mt-3 text-sm text-slate-700">{f.answer}</div>
              </details>
            ))
          )}
        </div>
      ) : null}
    </div>
  )
}
