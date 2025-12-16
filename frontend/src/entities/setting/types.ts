export type Setting = {
  id: number
  key: string
  value?: string | null
}

export type SettingListResponse = {
  data: Setting[]
  links?: { first?: string; last?: string; prev?: string | null; next?: string | null }
  meta?: { current_page: number; last_page: number; per_page: number; total: number }
}

export type SettingsMap = Record<string, string | null>

export type SettingsResponse = {
  settings: SettingsMap
}
