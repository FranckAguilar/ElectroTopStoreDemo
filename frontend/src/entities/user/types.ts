import type { Role } from '@/entities/role/types'

export type User = {
  id: number
  name: string
  email: string
  phone?: string | null
  role?: Role | null
  created_at?: string | null
}

export type UserListResponse = {
  data: User[]
  links?: { first?: string; last?: string; prev?: string | null; next?: string | null }
  meta?: { current_page: number; last_page: number; per_page: number; total: number }
}

