'use server'

import { revalidatePath } from 'next/cache'
import { createInsForgeServerClient, getCurrentUser, getAccessToken } from '@/lib/insforge/server'
import { accountSchema, type AccountValues } from '@/lib/schemas/accounts'

type ActionResult = { success: boolean, error?: string }

export async function createAccount(values: AccountValues): Promise<ActionResult> {
  const user = await getCurrentUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const parsed = accountSchema.safeParse(values)
  if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message }

  const token = await getAccessToken()
  const insforge = createInsForgeServerClient(token!)
  const { error } = await insforge.database.from('accounts').insert({
    name: parsed.data.name,
    type: parsed.data.type,
    slug: parsed.data.slug,
    user_id: user.id
  })

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard/accounts')
  return { success: true }
}

export async function updateAccount(id: string, values: AccountValues): Promise<ActionResult> {
  const user = await getCurrentUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const parsed = accountSchema.safeParse(values)
  if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message }

  const token = await getAccessToken()
  const insforge = createInsForgeServerClient(token!)
  const { error } = await insforge.database
    .from('accounts')
    .update({ name: parsed.data.name, type: parsed.data.type, slug: parsed.data.slug })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard/accounts')
  return { success: true }
}

export async function deleteAccount(id: string): Promise<ActionResult> {
  const user = await getCurrentUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const token = await getAccessToken()
  const insforge = createInsForgeServerClient(token!)
  const { error } = await insforge.database
    .from('accounts')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard/accounts')
  return { success: true }
}
