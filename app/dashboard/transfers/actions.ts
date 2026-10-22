'use server'

import { revalidatePath } from 'next/cache'
import { createInsForgeServerClient, getCurrentUser, getAccessToken } from '@/lib/insforge/server'
import { transferSchema, type TransferValues } from '@/lib/schemas/transfers'

type ActionResult = { success: boolean, error?: string }

export async function createTransfer(values: TransferValues): Promise<ActionResult> {
  const user = await getCurrentUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const parsed = transferSchema.safeParse(values)
  if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message }

  const token = await getAccessToken()
  const insforge = createInsForgeServerClient(token!)
  const { error } = await insforge.database.from('transfers').insert({
    name: parsed.data.name,
    date: parsed.data.date,
    amount: parsed.data.amount,
    to_amount: parsed.data.to_amount,
    from_account_id: parsed.data.from_account_id,
    to_account_id: parsed.data.to_account_id,
    user_id: user.id
  })

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard/accounts', 'layout')
  return { success: true }
}

export async function updateTransfer(id: string, values: TransferValues): Promise<ActionResult> {
  const user = await getCurrentUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const parsed = transferSchema.safeParse(values)
  if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message }

  const token = await getAccessToken()
  const insforge = createInsForgeServerClient(token!)
  const { error } = await insforge.database
    .from('transfers')
    .update({
      name: parsed.data.name,
      date: parsed.data.date,
      amount: parsed.data.amount,
      to_amount: parsed.data.to_amount,
      from_account_id: parsed.data.from_account_id,
      to_account_id: parsed.data.to_account_id
    })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard/accounts', 'layout')
  return { success: true }
}

export async function deleteTransfer(id: string): Promise<ActionResult> {
  const user = await getCurrentUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const token = await getAccessToken()
  const insforge = createInsForgeServerClient(token!)
  const { error } = await insforge.database
    .from('transfers')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard/accounts', 'layout')
  return { success: true }
}
