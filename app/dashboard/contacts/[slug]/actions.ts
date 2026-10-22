'use server'

import { revalidatePath } from 'next/cache'
import { createInsForgeServerClient, getCurrentUser, getAccessToken } from '@/lib/insforge/server'
import { loanSchema, type LoanValues } from '@/lib/schemas/loans'

type ActionResult = { success: boolean, error?: string }

export async function createLoan(values: LoanValues): Promise<ActionResult> {
  const user = await getCurrentUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const parsed = loanSchema.safeParse(values)
  if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message }

  const token = await getAccessToken()
  const insforge = createInsForgeServerClient(token!)
  const { error } = await insforge.database.from('loans').insert({
    account_id: parsed.data.account_id,
    contact_id: parsed.data.contact_id,
    direction: parsed.data.direction,
    amount: parsed.data.amount,
    description: parsed.data.description,
    user_id: user.id
  })

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard/contacts')
  return { success: true }
}

export async function updateLoan(id: string, values: LoanValues): Promise<ActionResult> {
  const user = await getCurrentUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const parsed = loanSchema.safeParse(values)
  if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message }

  const token = await getAccessToken()
  const insforge = createInsForgeServerClient(token!)
  const { error } = await insforge.database
    .from('loans')
    .update({
      account_id: parsed.data.account_id,
      contact_id: parsed.data.contact_id,
      direction: parsed.data.direction,
      amount: parsed.data.amount,
      description: parsed.data.description
    })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard/contacts')
  return { success: true }
}

export async function deleteLoan(id: string): Promise<ActionResult> {
  const user = await getCurrentUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const token = await getAccessToken()
  const insforge = createInsForgeServerClient(token!)
  const { error } = await insforge.database
    .from('loans')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard/contacts')
  return { success: true }
}
