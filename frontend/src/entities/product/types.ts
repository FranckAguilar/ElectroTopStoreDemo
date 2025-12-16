export type ProductImage = {
  id: number
  image_path: string
  url?: string | null
  order: number
}

export type Product = {
  id: number
  codigo: string
  name: string
  description?: string | null
  price: string
  stock_quantity: number
  status: 'active' | 'inactive' | string
  images?: ProductImage[]
}

export type ProductListResponse = {
  data: Product[]
  links?: { first?: string; last?: string; prev?: string | null; next?: string | null }
  meta?: { current_page: number; last_page: number; per_page: number; total: number }
}
