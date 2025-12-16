export type Brand = {
  id: number
  name: string
  slug: string
  logo_path?: string | null
  logo_url?: string | null
}

export type BrandListResponse = {
  data: Brand[]
}

