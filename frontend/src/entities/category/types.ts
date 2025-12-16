export type Category = {
  id: number
  name: string
  slug: string
  parent_id?: number | null
}

export type CategoryListResponse = {
  data: Category[]
}

