import { z } from 'zod'

export const transferSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  date: z.string().min(1, 'Date is required'),
  amount: z
    .number({ invalid_type_error: 'Amount is required' })
    .positive('Amount must be positive'),
  to_amount: z
    .number({ invalid_type_error: 'Amount is required' })
    .positive('Amount must be positive'),
  from_account_id: z.string().min(1, 'From account is required'),
  to_account_id: z.string().min(1, 'To account is required')
}).refine((data) => data.from_account_id !== data.to_account_id, {
  message: 'From and to accounts must be different',
  path: ['to_account_id']
})

export type TransferValues = z.infer<typeof transferSchema>

export interface Transfer {
  id: string
  user_id: string
  created_at: string
  name: string
  date: string
  amount: number
  to_amount: number
  from_account_id: string
  to_account_id: string
  // InsForge join results use the source table name as the key.
  accounts?: { name: string }[]
}
