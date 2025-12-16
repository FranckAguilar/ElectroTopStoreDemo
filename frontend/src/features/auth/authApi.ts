import { apiRequest } from '@/shared/api/client'

export type LoginResponse = {
  token: string
  user: {
    id: number
    name: string
    email: string
    phone?: string | null
    role?: { id: number; name: string }
  }
}

export type RegisterPayload = {
  name: string
  email: string
  password: string
  phone?: string
}

export async function login(email: string, password: string, headers: Record<string, string> = {}) {
  return apiRequest<LoginResponse>('/auth/login', {
    method: 'POST',
    headers,
    body: { email, password },
  })
}

export async function register(payload: RegisterPayload, headers: Record<string, string> = {}) {
  return apiRequest<LoginResponse>('/auth/register', {
    method: 'POST',
    headers,
    body: payload,
  })
}

export async function me(headers: Record<string, string>) {
  return apiRequest<{ user: LoginResponse['user'] }>('/auth/me', { headers })
}

