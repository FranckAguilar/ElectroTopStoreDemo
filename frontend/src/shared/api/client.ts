import { env } from '@/shared/config/env'

export class ApiError extends Error {
  public readonly status: number
  public readonly payload: unknown

  constructor(message: string, status: number, payload: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.payload = payload
  }
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export type JsonValue = string | number | boolean | null | JsonValue[] | { [k: string]: JsonValue }

type RequestOptions = {
  method?: HttpMethod
  headers?: Record<string, string>
  body?: JsonValue
  signal?: AbortSignal
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const url = `${env.apiBaseUrl}${path.startsWith('/') ? path : `/${path}`}`

  const response = await fetch(url, {
    method: options.method ?? 'GET',
    headers: {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers ?? {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    signal: options.signal,
  })

  const contentType = response.headers.get('content-type') ?? ''
  const isJson = contentType.includes('application/json')
  const payload = isJson ? await response.json() : await response.text()

  if (!response.ok) {
    const message = typeof payload === 'object' && payload && 'message' in payload ? String(payload.message) : 'Request failed'
    throw new ApiError(message, response.status, payload)
  }

  return payload as T
}

export async function apiUpload<T>(
  path: string,
  formData: FormData,
  headers: Record<string, string> = {},
): Promise<T> {
  const url = `${env.apiBaseUrl}${path.startsWith('/') ? path : `/${path}`}`
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      ...headers,
    },
    body: formData,
  })

  const contentType = response.headers.get('content-type') ?? ''
  const isJson = contentType.includes('application/json')
  const payload = isJson ? await response.json() : await response.text()

  if (!response.ok) {
    const message = typeof payload === 'object' && payload && 'message' in payload ? String(payload.message) : 'Upload failed'
    throw new ApiError(message, response.status, payload)
  }

  return payload as T
}
