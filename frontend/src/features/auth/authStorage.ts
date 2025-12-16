import { getLocalStorage, setLocalStorage } from '@/shared/lib/storage'

const CUSTOMER_TOKEN_KEY = 'ets_customer_token'
const ADMIN_TOKEN_KEY = 'ets_admin_token'
const CUSTOMER_USER_KEY = 'ets_customer_user'
const ADMIN_USER_KEY = 'ets_admin_user'

export type AuthKind = 'customer' | 'admin'

export type AuthUser = {
  id: number
  name: string
  email: string
  phone?: string | null
  role?: { id: number; name: string }
}

function tokenKey(kind: AuthKind): string {
  return kind === 'admin' ? ADMIN_TOKEN_KEY : CUSTOMER_TOKEN_KEY
}

function userKey(kind: AuthKind): string {
  return kind === 'admin' ? ADMIN_USER_KEY : CUSTOMER_USER_KEY
}

export function getToken(kind: AuthKind): string | null {
  return getLocalStorage(tokenKey(kind))
}

export function setToken(kind: AuthKind, token: string | null): void {
  setLocalStorage(tokenKey(kind), token)
}

export function getUser(kind: AuthKind): AuthUser | null {
  const raw = getLocalStorage(userKey(kind))
  if (!raw) return null
  try {
    return JSON.parse(raw) as AuthUser
  } catch {
    return null
  }
}

export function setUser(kind: AuthKind, user: AuthUser | null): void {
  setLocalStorage(userKey(kind), user ? JSON.stringify(user) : null)
}

