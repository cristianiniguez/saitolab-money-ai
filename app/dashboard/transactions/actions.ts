'use server'

import { revalidatePath } from 'next/cache'
import { createInsForgeServerClient, getCurrentUser, getAccessToken } from '@/lib/insforge/server'
import { transactionSchema, type TransactionValues } from '@/lib/schemas/transactions'

type ImportRowError = { row: number, message: string }
type ImportResult = { success: boolean, imported: number, errors: ImportRowError[], error?: string }

export async function importTransactions(
  rows: Array<Record<string, string>>
): Promise<ImportResult> {
  const user = await getCurrentUser()
  if (!user) return { success: false, imported: 0, errors: [], error: 'Unauthorized' }

  const token = await getAccessToken()
  const insforge = createInsForgeServerClient(token!)

  // Fetch slug → id maps for accounts and categories
  const [{ data: accounts }, { data: categories }] = await Promise.all([
    insforge.database.from('accounts').select('id, slug').eq('user_id', user.id),
    insforge.database.from('categories').select('id, slug').eq('user_id', user.id)
  ])

  const accountMap = new Map<string, string>(
    (accounts ?? []).map((a: { id: string, slug: string }) => [a.slug, a.id])
  )
  const categoryMap = new Map<string, string>(
    (categories ?? []).map((c: { id: string, slug: string }) => [c.slug, c.id])
  )

  const toInsert: TransactionValues[] = []
  const errors: ImportRowError[] = []

  for (let i = 0; i < rows.length; i++) {
    const raw = rows[i]
    const accountSlug = raw.account_slug?.trim()
    const categorySlug = raw.category_slug?.trim()

    const account_id = accountMap.get(accountSlug)
    if (!account_id) {
      errors.push({ row: i + 2, message: `Account slug "${accountSlug}" not found` })
      continue
    }

    const category_id = categorySlug ? categoryMap.get(categorySlug) : undefined
    if (categorySlug && !category_id) {
      errors.push({ row: i + 2, message: `Category slug "${categorySlug}" not found` })
      continue
    }

    const amount = parseFloat(raw.amount)
    const parsed = transactionSchema.safeParse({
      name: raw.name?.trim(),
      date: raw.date?.trim(),
      amount: isNaN(amount) ? undefined : amount,
      type: raw.type?.trim(),
      account_id,
      category_id: category_id || undefined
    })

    if (!parsed.success) {
      errors.push({ row: i + 2, message: parsed.error.errors[0]?.message ?? 'Invalid row' })
      continue
    }

    toInsert.push(parsed.data)
  }

  if (toInsert.length === 0) {
    return { success: true, imported: 0, errors }
  }

  const { error } = await insforge.database.from('transactions').insert(
    toInsert.map(t => ({
      name: t.name,
      date: t.date,
      amount: t.amount,
      type: t.type,
      account_id: t.account_id,
      category_id: t.category_id || null,
      user_id: user.id
    }))
  )

  if (error) return { success: false, imported: 0, errors, error: error.message }

  revalidatePath('/dashboard/transactions')
  return { success: true, imported: toInsert.length, errors }
}

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
