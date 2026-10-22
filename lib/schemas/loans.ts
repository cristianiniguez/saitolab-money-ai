import { z } from 'zod'

export const LOAN_DIRECTIONS = ['lent', 'borrowed'] as const
export type LoanDirection = typeof LOAN_DIRECTIONS[number]

export const loanSchema = z.object({
  amount: z.coerce.number().positive('Amount must be greater than 0'),
  contact_id: z.string().min(1, 'Contact is required'),
  description: z.string(),
  direction: z.enum(LOAN_DIRECTIONS, { message: 'Select a valid direction' })
})

export type LoanValues = z.infer<typeof loanSchema>

export interface Loan extends LoanValues {
  id: string
  user_id: string
  created_at: string
  contacts?: { name: string } | null
}
