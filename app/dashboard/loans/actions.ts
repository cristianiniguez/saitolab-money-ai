'use server'

import { revalidatePath } from 'next/cache'
import { createInsForgeServerClient, getCurrentUser, getAccessToken } from '@/lib/insforge/server'
import { loanSchema, type LoanValues } from '@/lib/schemas/loans'

type ActionResult = { success: boolean, error?: string }
type ImportRowError = { row: number, message: string }
type ImportResult = { success: boolean, imported: number, errors: ImportRowError[], error?: string }
type InsForgeServerClient = ReturnType<typeof createInsForgeServerClient>

const CURRENCY_MISMATCH = 'Loans can only be linked to accounts in your main currency'

async function getMainCurrencyId(insforge: InsForgeServerClient, userId: string): Promise<string | null> {
  const { data } = await insforge.database
    .from('user_settings')
    .select('main_currency_id')
    .eq('user_id', userId)
    .limit(1)
  return (data as { main_currency_id: string | null }[] | null)?.[0]?.main_currency_id ?? null
}

// Loan amounts are recorded in the user's main currency, so a linked account must use it too.
async function validateLoanAccount(
  insforge: InsForgeServerClient,
  userId: string,
  accountId: string | null | undefined
): Promise<string | null> {
  if (!accountId) return null

  const [mainCurrencyId, { data: account }] = await Promise.all([
    getMainCurrencyId(insforge, userId),
    insforge.database
      .from('accounts')
      .select('currency_id')
      .eq('id', accountId)
      .eq('user_id', userId)
      .maybeSingle()
  ])

  if (!account) return 'Account not found'
  if (!mainCurrencyId) return 'Set a main currency in Settings before linking loans to accounts'
  if ((account as { currency_id: string }).currency_id !== mainCurrencyId) return CURRENCY_MISMATCH
  return null
}

export async function importLoans(
  rows: Array<Record<string, string>>
): Promise<ImportResult> {
  const user = await getCurrentUser()
  if (!user) return { success: false, imported: 0, errors: [], error: 'Unauthorized' }

  const token = await getAccessToken()
  const insforge = createInsForgeServerClient(token!)

  // Fetch slug → id maps for contacts and accounts
  const [{ data: contacts }, { data: accounts }, mainCurrencyId] = await Promise.all([
    insforge.database.from('contacts').select('id, slug').eq('user_id', user.id),
    insforge.database.from('accounts').select('id, slug, currency_id').eq('user_id', user.id),
    getMainCurrencyId(insforge, user.id)
  ])

  const contactMap = new Map<string, string>(
    (contacts ?? []).map((c: { id: string, slug: string }) => [c.slug, c.id])
  )
  const accountMap = new Map<string, { id: string, currency_id: string }>(
    (accounts ?? []).map((a: { id: string, slug: string, currency_id: string }) => [a.slug, a])
  )

  const toInsert: LoanValues[] = []
  const errors: ImportRowError[] = []

  for (let i = 0; i < rows.length; i++) {
    const raw = rows[i]
    const contactSlug = raw.contact_slug?.trim()
    const accountSlug = raw.account_slug?.trim()

    const contact_id = contactMap.get(contactSlug)
    if (!contact_id) {
      errors.push({ row: i + 2, message: `Contact slug "${contactSlug}" not found` })
      continue
    }

    const account = accountSlug ? accountMap.get(accountSlug) : undefined
    if (accountSlug && !account) {
      errors.push({ row: i + 2, message: `Account slug "${accountSlug}" not found` })
      continue
    }
    if (account && account.currency_id !== mainCurrencyId) {
      errors.push({ row: i + 2, message: `Account "${accountSlug}": ${CURRENCY_MISMATCH.toLowerCase()}` })
      continue
    }
    const account_id = account?.id

    const parsed = loanSchema.safeParse({
      account_id: account_id ?? null,
      amount: raw.amount?.trim(),
      contact_id,
      date: raw.date?.trim(),
      description: raw.description?.trim() ?? '',
      direction: raw.direction?.trim()
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

  const { error } = await insforge.database.from('loans').insert(
    toInsert.map(l => ({
      account_id: l.account_id,
      contact_id: l.contact_id,
      date: l.date,
      direction: l.direction,
      amount: l.amount,
      description: l.description,
      user_id: user.id
    }))
  )

  if (error) return { success: false, imported: 0, errors, error: error.message }

  revalidatePath('/dashboard/loans')
  revalidatePath('/dashboard/contacts', 'layout')
  revalidatePath('/dashboard/accounts', 'layout')
  return { success: true, imported: toInsert.length, errors }
}

export async function createLoan(values: LoanValues): Promise<ActionResult> {
  const user = await getCurrentUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const parsed = loanSchema.safeParse(values)
  if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message }

  const token = await getAccessToken()
  const insforge = createInsForgeServerClient(token!)

  const accountError = await validateLoanAccount(insforge, user.id, parsed.data.account_id)
  if (accountError) return { success: false, error: accountError }

  const { error } = await insforge.database.from('loans').insert({
    account_id: parsed.data.account_id,
    contact_id: parsed.data.contact_id,
    date: parsed.data.date,
    direction: parsed.data.direction,
    amount: parsed.data.amount,
    description: parsed.data.description,
    user_id: user.id
  })

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard/loans')
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

  const accountError = await validateLoanAccount(insforge, user.id, parsed.data.account_id)
  if (accountError) return { success: false, error: accountError }

  const { error } = await insforge.database
    .from('loans')
    .update({
      account_id: parsed.data.account_id,
      contact_id: parsed.data.contact_id,
      date: parsed.data.date,
      direction: parsed.data.direction,
      amount: parsed.data.amount,
      description: parsed.data.description
    })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard/loans')
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

  revalidatePath('/dashboard/loans')
  revalidatePath('/dashboard/contacts')
  return { success: true }
}
