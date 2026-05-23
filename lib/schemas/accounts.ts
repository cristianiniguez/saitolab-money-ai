import { z } from 'zod'

export const ACCOUNT_TYPES = ['bank', 'wallet', 'crypto'] as const
export type AccountType = typeof ACCOUNT_TYPES[number]

export const accountSchema = z.object({
  currency_id: z.string().min(1, 'Currency is required'),
  name: z.string().min(1, 'Name is required'),
  slug: z.string().regex(/^[a-z0-9-]*$/, 'Invalid slug').min(1, 'Slug is required'),
  type: z.enum(ACCOUNT_TYPES, { message: 'Select a valid type' })
})

export type AccountValues = z.infer<typeof accountSchema>

export interface Account extends AccountValues {
  id: string
  user_id: string
  created_at: string
  currencies?: { id: string, name: string, symbol: string } | null
}
