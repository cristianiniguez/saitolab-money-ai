import { z } from 'zod'

export const TRANSACTION_TYPES = ['income', 'expense'] as const
export type TransactionType = typeof TRANSACTION_TYPES[number]

export const transactionSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  date: z.string().min(1, 'Date is required'),
  amount: z
    .number({ invalid_type_error: 'Amount is required' })
    .positive('Amount must be positive'),
  type: z.enum(TRANSACTION_TYPES, { message: 'Select income or expense' }),
  account_id: z.string().min(1, 'Account is required'),
  category_id: z.string().optional()
})

export type TransactionValues = z.infer<typeof transactionSchema>

export interface Transaction {
  id: string
  user_id: string
  created_at: string
  name: string
  date: string
  amount: number
  type: TransactionType
  account_id: string
  category_id?: string | null
  // InsForge join results use the source table name as the key.
  // Each is a single object (one account, zero or one category).
  accounts?: { name: string }
  categories?: { name: string } | null
}
