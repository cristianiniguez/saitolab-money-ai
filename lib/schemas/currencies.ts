export const CURRENCY_TYPES = ['fiat', 'crypto'] as const
export type CurrencyType = typeof CURRENCY_TYPES[number]

export interface Currency {
  id: string
  slug: string
  name: string
  symbol: string
  type: CurrencyType
  rate_usd: number
  updated_at: string
}
