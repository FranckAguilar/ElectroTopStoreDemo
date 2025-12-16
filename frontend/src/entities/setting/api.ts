import { apiRequest } from '@/shared/api/client'
import type { SettingsResponse } from '@/entities/setting/types'

export async function getSettings(params: { keys?: string[] } = {}) {
  const query = new URLSearchParams()
  for (const key of params.keys ?? []) query.append('keys[]', key)
  const suffix = query.toString() ? `?${query.toString()}` : ''
  return apiRequest<SettingsResponse>(`/settings${suffix}`)
}

