'use server'

import { revalidatePath } from 'next/cache'
import { createInsForgeServerClient, getCurrentUser, getAccessToken } from '@/lib/insforge/server'
import { transferSchema, type TransferValues } from '@/lib/schemas/transfers'

type ActionResult = { success: boolean, error?: string }
type ImportRowError = { row: number, message: string }
type ImportResult = { success: boolean, imported: number, errors: ImportRowError[], error?: string }

export async function importTransfers(
  rows: Array<Record<string, string>>
): Promise<ImportResult> {
  const user = await getCurrentUser()
  if (!user) return { success: false, imported: 0, errors: [], error: 'Unauthorized' }

  const token = await getAccessToken()
  const insforge = createInsForgeServerClient(token!)

  const { data: accounts } = await insforge.database
    .from('accounts')
    .select('id, slug')
    .eq('user_id', user.id)

  const accountMap = new Map<string, string>(
    (accounts ?? []).map((a: { id: string, slug: string }) => [a.slug, a.id])
  )

  const toInsert: TransferValues[] = []
  const errors: ImportRowError[] = []

  for (let i = 0; i < rows.length; i++) {
    const raw = rows[i]
    const fromSlug = raw.from_account_slug?.trim()
    const toSlug = raw.to_account_slug?.trim()

    const from_account_id = accountMap.get(fromSlug)
    if (!from_account_id) {
      errors.push({ row: i + 2, message: `Account slug "${fromSlug}" not found` })
      continue
    }

    const to_account_id = accountMap.get(toSlug)
    if (!to_account_id) {
      errors.push({ row: i + 2, message: `Account slug "${toSlug}" not found` })
      continue
    }

    const amount = parseFloat(raw.amount)
    // to_amount defaults to amount for same-currency transfers
    const toAmount = raw.to_amount?.trim() ? parseFloat(raw.to_amount) : amount
    const parsed = transferSchema.safeParse({
      name: raw.name?.trim(),
      date: raw.date?.trim(),
      amount: isNaN(amount) ? undefined : amount,
      to_amount: isNaN(toAmount) ? undefined : toAmount,
      from_account_id,
      to_account_id
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

  const { error } = await insforge.database.from('transfers').insert(
    toInsert.map(t => ({
      name: t.name,
      date: t.date,
      amount: t.amount,
      to_amount: t.to_amount,
      from_account_id: t.from_account_id,
      to_account_id: t.to_account_id,
      user_id: user.id
    }))
  )

  if (error) return { success: false, imported: 0, errors, error: error.message }

  revalidatePath('/dashboard/transfers')
  revalidatePath('/dashboard/accounts', 'layout')
  return { success: true, imported: toInsert.length, errors }
}

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

  revalidatePath('/dashboard/transfers')
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

  revalidatePath('/dashboard/transfers')
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

  revalidatePath('/dashboard/transfers')
  revalidatePath('/dashboard/accounts', 'layout')
  return { success: true }
}
