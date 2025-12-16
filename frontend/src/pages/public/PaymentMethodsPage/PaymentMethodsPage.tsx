import { useEffect, useState } from 'react'
import { listPaymentMethods } from '@/entities/paymentMethod/api'
import type { PaymentMethod } from '@/entities/paymentMethod/types'
import { ErrorMessage } from '@/shared/components/ErrorMessage'
import { Loading } from '@/shared/components/Loading'

export function PaymentMethodsPage() {
  const [methods, setMethods] = useState<PaymentMethod[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    setError(null)

    void (async () => {
      try {
        const result = await listPaymentMethods()
        if (!cancelled) setMethods(result.data)
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Error cargando medios de pago.')
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
      <h1 className="text-xl font-semibold">Medios de pago</h1>
      {isLoading ? <Loading /> : null}
      {error ? <ErrorMessage message={error} /> : null}

      {!isLoading && !error ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {methods.map((m) => (
            <div key={m.id} className="rounded-2xl border bg-white p-6">
              <div className="text-base font-semibold text-slate-900">{m.name}</div>
              <div className="mt-3 space-y-1 text-sm text-slate-600">
                {m.bank_name ? <div>Banco: {m.bank_name}</div> : null}
                {m.owner_name ? <div>Titular: {m.owner_name}</div> : null}
                {m.account_number ? <div>{`N\u00b0 Cuenta`}: {m.account_number}</div> : null}
                {m.cci_number ? <div>CCI: {m.cci_number}</div> : null}
                {m.yape_number ? <div>Yape: {m.yape_number}</div> : null}
              </div>
              {m.instructions ? (
                <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
                  {m.instructions}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}
