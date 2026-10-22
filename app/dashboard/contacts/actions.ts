'use server'

import { revalidatePath } from 'next/cache'
import { createInsForgeServerClient, getCurrentUser, getAccessToken } from '@/lib/insforge/server'
import { contactSchema, type ContactValues } from '@/lib/schemas/contacts'
import { slugify } from '@/lib/utils/slugify'

type ActionResult = { success: boolean, error?: string }

export async function createContact(values: ContactValues): Promise<ActionResult> {
  const user = await getCurrentUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const parsed = contactSchema.safeParse(values)
  if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message }

  const token = await getAccessToken()
  const insforge = createInsForgeServerClient(token!)
  const { error } = await insforge.database.from('contacts').insert({
    name: parsed.data.name,
    slug: parsed.data.slug,
    user_id: user.id
  })

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard/contacts')
  return { success: true }
}

export async function updateContact(id: string, values: ContactValues): Promise<ActionResult> {
  const user = await getCurrentUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const parsed = contactSchema.safeParse(values)
  if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message }

  const token = await getAccessToken()
  const insforge = createInsForgeServerClient(token!)
  const { error } = await insforge.database
    .from('contacts')
    .update({ name: parsed.data.name, slug: parsed.data.slug })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard/contacts')
  return { success: true }
}

type ImportRowError = { row: number, message: string }
type ImportResult = { success: boolean, imported: number, errors: ImportRowError[], error?: string }

export async function importContacts(
  rows: Array<Record<string, string>>
): Promise<ImportResult> {
  const user = await getCurrentUser()
  if (!user) return { success: false, imported: 0, errors: [], error: 'Unauthorized' }

  const token = await getAccessToken()
  const insforge = createInsForgeServerClient(token!)

  const toInsert: ContactValues[] = []
  const errors: ImportRowError[] = []

  for (let i = 0; i < rows.length; i++) {
    const raw = rows[i]
    const slug = raw.slug?.trim() || slugify(raw.name?.trim() ?? '')
    const parsed = contactSchema.safeParse({ name: raw.name?.trim(), slug })
    if (!parsed.success) {
      errors.push({ row: i + 2, message: parsed.error.errors[0]?.message ?? 'Invalid row' })
      continue
    }
    toInsert.push(parsed.data)
  }

  if (toInsert.length === 0) {
    return { success: true, imported: 0, errors }
  }

  const { error } = await insforge.database.from('contacts').insert(
    toInsert.map(c => ({ ...c, user_id: user.id }))
  )

  if (error) return { success: false, imported: 0, errors, error: error.message }

  revalidatePath('/dashboard/contacts')
  return { success: true, imported: toInsert.length, errors }
}

export async function deleteContact(id: string): Promise<ActionResult> {
  const user = await getCurrentUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const token = await getAccessToken()
  const insforge = createInsForgeServerClient(token!)
  const { error } = await insforge.database
    .from('contacts')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard/contacts')
  return { success: true }
}
