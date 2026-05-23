'use server'

import { revalidatePath } from 'next/cache'
import { createInsForgeServerClient, getCurrentUser, getAccessToken } from '@/lib/insforge/server'
import { accountSchema, type AccountValues } from '@/lib/schemas/accounts'
import { slugify } from '@/lib/utils/slugify'

type ActionResult = { success: boolean, error?: string }

export async function createAccount(values: AccountValues): Promise<ActionResult> {
  const user = await getCurrentUser()
  if (!user) return { error: 'Unauthorized', success: false }

  const parsed = accountSchema.safeParse(values)
  if (!parsed.success) return { error: parsed.error.errors[0]?.message, success: false }

  const token = await getAccessToken()
  const insforge = createInsForgeServerClient(token!)
  const { error } = await insforge.database.from('accounts').insert({
    currency_id: parsed.data.currency_id,
    name: parsed.data.name,
    slug: parsed.data.slug,
    type: parsed.data.type,
    user_id: user.id
  })

  if (error) return { error: error.message, success: false }

  revalidatePath('/dashboard/accounts')
  return { success: true }
}

export async function updateAccount(id: string, values: AccountValues): Promise<ActionResult> {
  const user = await getCurrentUser()
  if (!user) return { error: 'Unauthorized', success: false }

  const parsed = accountSchema.safeParse(values)
  if (!parsed.success) return { error: parsed.error.errors[0]?.message, success: false }

  const token = await getAccessToken()
  const insforge = createInsForgeServerClient(token!)
  const { error } = await insforge.database
    .from('accounts')
    .update({ currency_id: parsed.data.currency_id, name: parsed.data.name, slug: parsed.data.slug, type: parsed.data.type })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message, success: false }

  revalidatePath('/dashboard/accounts')
  return { success: true }
}

type ImportRowError = { row: number, message: string }
type ImportResult = { success: boolean, imported: number, errors: ImportRowError[], error?: string }

export async function importAccounts(
  rows: Array<Record<string, string>>
): Promise<ImportResult> {
  const user = await getCurrentUser()
  if (!user) return { error: 'Unauthorized', errors: [], imported: 0, success: false }

  const token = await getAccessToken()
  const insforge = createInsForgeServerClient(token!)

  // Resolve currency slugs to IDs; fetch all currencies once
  const { data: currencies } = await insforge.database
    .from('currencies')
    .select('id, slug')
  const currencyBySlug = Object.fromEntries((currencies ?? []).map((c: { id: string, slug: string }) => [c.slug, c.id]))
  const usdId = currencyBySlug['usd'] ?? null

  const toInsert: AccountValues[] = []
  const errors: ImportRowError[] = []

  for (let i = 0; i < rows.length; i++) {
    const raw = rows[i]
    const slug = raw.slug?.trim() || slugify(raw.name?.trim() ?? '')
    const currencySlug = raw.currency_slug?.trim().toLowerCase()
    const currency_id = (currencySlug ? currencyBySlug[currencySlug] : usdId) ?? usdId ?? ''
    const parsed = accountSchema.safeParse({ currency_id, name: raw.name?.trim(), slug, type: raw.type?.trim() })
    if (!parsed.success) {
      errors.push({ message: parsed.error.errors[0]?.message ?? 'Invalid row', row: i + 2 })
      continue
    }
    toInsert.push(parsed.data)
  }

  if (toInsert.length === 0) {
    return { errors, imported: 0, success: true }
  }

  const { error } = await insforge.database.from('accounts').insert(
    toInsert.map(a => ({ ...a, user_id: user.id }))
  )

  if (error) return { error: error.message, errors, imported: 0, success: false }

  revalidatePath('/dashboard/accounts')
  return { errors, imported: toInsert.length, success: true }
}

export async function deleteAccount(id: string): Promise<ActionResult> {
  const user = await getCurrentUser()
  if (!user) return { error: 'Unauthorized', success: false }

  const token = await getAccessToken()
  const insforge = createInsForgeServerClient(token!)
  const { error } = await insforge.database
    .from('accounts')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message, success: false }

  revalidatePath('/dashboard/accounts')
  return { success: true }
}
