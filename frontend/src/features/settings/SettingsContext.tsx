/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { getSettings } from '@/entities/setting/api'
import type { SettingsMap } from '@/entities/setting/types'

type SettingsContextValue = {
  isLoading: boolean
  error: string | null
  settings: SettingsMap
  refresh: () => Promise<void>
  get: (key: string, fallback?: string) => string
}

const SettingsContext = createContext<SettingsContextValue | null>(null)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SettingsMap>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await getSettings()
      setSettings(res.settings ?? {})
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error cargando settings.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const get = useCallback(
    (key: string, fallback = '') => {
      const v = settings[key]
      return v == null ? fallback : String(v)
    },
    [settings],
  )

  const value = useMemo<SettingsContextValue>(() => ({ isLoading, error, settings, refresh, get }), [
    isLoading,
    error,
    settings,
    refresh,
    get,
  ])

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export function useSettings() {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider')
  return ctx
}
