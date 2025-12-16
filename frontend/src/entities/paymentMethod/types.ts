export type PaymentMethod = {
  id: number
  name: string
  bank_name?: string | null
  account_number?: string | null
  cci_number?: string | null
  yape_number?: string | null
  owner_name?: string | null
  instructions?: string | null
}

export type PaymentMethodListResponse = {
  data: PaymentMethod[]
}

