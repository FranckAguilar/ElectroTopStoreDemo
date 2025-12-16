/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

type ToastType = 'success' | 'error' | 'info'

export type Toast = {
  id: string
  type: ToastType
  title: string
  message?: string
}

type ToastContextValue = {
  push: (toast: Omit<Toast, 'id'>) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

function randomId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const push = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = randomId()
    const next: Toast = { id, ...toast }
    setToasts((prev) => [next, ...prev])
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4000)
  }, [])

  const value = useMemo(() => ({ push }), [push])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-50 space-y-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={[
              'pointer-events-auto w-[22rem] rounded-2xl border bg-white p-4 shadow-lg',
              t.type === 'success' ? 'border-emerald-200' : '',
              t.type === 'error' ? 'border-rose-200' : '',
              t.type === 'info' ? 'border-slate-200' : '',
            ].join(' ')}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-slate-900">{t.title}</div>
                {t.message ? <div className="mt-1 text-xs text-slate-600">{t.message}</div> : null}
              </div>
              <button
                className="rounded-lg border px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
              >
                X
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
