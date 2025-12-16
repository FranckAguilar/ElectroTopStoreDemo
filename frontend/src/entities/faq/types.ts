export type Faq = {
  id: number
  question: string
  answer: string
  order: number
}

export type FaqListResponse = {
  data: Faq[]
}

