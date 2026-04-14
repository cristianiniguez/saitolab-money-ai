'use server'

import { revalidatePath } from 'next/cache'
import { createInsForgeServerClient, getCurrentUser, getAccessToken } from '@/lib/insforge/server'
import { transactionSchema, type TransactionValues } from '@/lib/schemas/transactions'

type ActionResult = { success: boolean, error?: string }

export async function createTransaction(values: TransactionValues): Promise<ActionResult> {
  const user = await getCurrentUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const parsed = transactionSchema.safeParse(values)
  if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message }

  const token = await getAccessToken()
  const insforge = createInsForgeServerClient(token!)
  const { error } = await insforge.database.from('transactions').insert({
    user_id: user.id,
    name: parsed.data.name,
    date: parsed.data.date,
    amount: parsed.data.amount,
    type: parsed.data.type,
    account_id: parsed.data.account_id,
    category_id: parsed.data.category_id || null
  })

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard/transactions')
  return { success: true }
}

export async function updateTransaction(id: string, values: TransactionValues): Promise<ActionResult> {
  const user = await getCurrentUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const parsed = transactionSchema.safeParse(values)
  if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message }

  const token = await getAccessToken()
  const insforge = createInsForgeServerClient(token!)
  const { error } = await insforge.database
    .from('transactions')
    .update({
      name: parsed.data.name,
      date: parsed.data.date,
      amount: parsed.data.amount,
      type: parsed.data.type,
      account_id: parsed.data.account_id,
      category_id: parsed.data.category_id || null
    })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard/transactions')
  return { success: true }
}

export async function deleteTransaction(id: string): Promise<ActionResult> {
  const user = await getCurrentUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const token = await getAccessToken()
  const insforge = createInsForgeServerClient(token!)
  const { error } = await insforge.database
    .from('transactions')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard/transactions')
  return { success: true }
}
