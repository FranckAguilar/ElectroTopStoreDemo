/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { login as loginApi, me as meApi, register as registerApi, type RegisterPayload } from '@/features/auth/authApi'
import { getToken, getUser, setToken, setUser, type AuthKind, type AuthUser } from '@/features/auth/authStorage'

type AuthState = {
  kind: AuthKind
  token: string | null
  user: AuthUser | null
  isLoading: boolean
  login: (email: string, password: string, sessionId?: string | null) => Promise<AuthUser>
  register: (payload: RegisterPayload, sessionId?: string | null) => Promise<AuthUser>
  logout: () => void
  refreshMe: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

function authHeaders(token: string | null, sessionId?: string | null): Record<string, string> {
  const headers: Record<string, string> = {}
  if (token) headers.Authorization = `Bearer ${token}`
  if (sessionId) headers['X-Session-Id'] = sessionId
  return headers
}

export function AuthProvider({ kind, children }: { kind: AuthKind; children: React.ReactNode }) {
  const [token, setTokenState] = useState<string | null>(() => getToken(kind))
  const [user, setUserState] = useState<AuthUser | null>(() => getUser(kind))
  const [isLoading, setIsLoading] = useState(false)

  const persist = useCallback(
    (nextToken: string | null, nextUser: AuthUser | null) => {
      setToken(kind, nextToken)
      setUser(kind, nextUser)
      setTokenState(nextToken)
      setUserState(nextUser)
    },
    [kind],
  )

  const refreshMe = useCallback(async () => {
    if (!token) return
    setIsLoading(true)
    try {
      const result = await meApi(authHeaders(token))
      persist(token, result.user)
    } finally {
      setIsLoading(false)
    }
  }, [persist, token])

  const login = useCallback(
    async (email: string, password: string, sessionId?: string | null) => {
      setIsLoading(true)
      try {
        const result = await loginApi(email, password, authHeaders(null, sessionId))
        persist(result.token, result.user)
        return result.user
      } finally {
        setIsLoading(false)
      }
    },
    [persist],
  )

  const register = useCallback(
    async (payload: RegisterPayload, sessionId?: string | null) => {
      setIsLoading(true)
      try {
        const result = await registerApi(payload, authHeaders(null, sessionId))
        persist(result.token, result.user)
        return result.user
      } finally {
        setIsLoading(false)
      }
    },
    [persist],
  )

  const logout = useCallback(() => {
    persist(null, null)
  }, [persist])

  const value = useMemo<AuthState>(
    () => ({ kind, token, user, isLoading, login, register, logout, refreshMe }),
    [kind, token, user, isLoading, login, register, logout, refreshMe],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
