'use server'

import { revalidatePath } from 'next/cache'
import { createInsForgeServerClient, getCurrentUser, getAccessToken } from '@/lib/insforge/server'
import { accountSchema, type AccountValues } from '@/lib/schemas/accounts'
import { slugify } from '@/lib/utils/slugify'

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

type ImportRowError = { row: number, message: string }
type ImportResult = { success: boolean, imported: number, errors: ImportRowError[], error?: string }

export async function importAccounts(
  rows: Array<Record<string, string>>
): Promise<ImportResult> {
  const user = await getCurrentUser()
  if (!user) return { success: false, imported: 0, errors: [], error: 'Unauthorized' }

  const token = await getAccessToken()
  const insforge = createInsForgeServerClient(token!)

  const toInsert: AccountValues[] = []
  const errors: ImportRowError[] = []

  for (let i = 0; i < rows.length; i++) {
    const raw = rows[i]
    const slug = raw.slug?.trim() || slugify(raw.name?.trim() ?? '')
    const parsed = accountSchema.safeParse({ name: raw.name?.trim(), type: raw.type?.trim(), slug })
    if (!parsed.success) {
      errors.push({ row: i + 2, message: parsed.error.errors[0]?.message ?? 'Invalid row' })
      continue
    }
    toInsert.push(parsed.data)
  }

  if (toInsert.length === 0) {
    return { success: true, imported: 0, errors }
  }

  const { error } = await insforge.database.from('accounts').insert(
    toInsert.map(a => ({ ...a, user_id: user.id }))
  )

  if (error) return { success: false, imported: 0, errors, error: error.message }

  revalidatePath('/dashboard/accounts')
  return { success: true, imported: toInsert.length, errors }
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
