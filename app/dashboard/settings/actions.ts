'use server'

import { revalidatePath } from 'next/cache'
import { createInsForgeServerClient, getCurrentUser, getAccessToken } from '@/lib/insforge/server'
import { userSettingsSchema, type UserSettings, type UserSettingsValues } from '@/lib/schemas/settings'

export async function getUserSettings(): Promise<{ data: UserSettings | null; error: string | null }> {
  const user = await getCurrentUser()
  if (!user) return { data: null, error: 'Unauthorized' }

  const token = await getAccessToken()
  const insforge = createInsForgeServerClient(token!)
  const { data, error } = await insforge.database
    .from('user_settings')
    .select('*, currencies(id, name, symbol, slug)')
    .eq('user_id', user.id)
    .limit(1)

  if (error) return { data: null, error: error.message }
  return { data: (data?.[0] as UserSettings) ?? null, error: null }
}

export async function upsertUserSettings(values: UserSettingsValues): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { error: 'Unauthorized', success: false }

  const parsed = userSettingsSchema.safeParse(values)
  if (!parsed.success) return { error: parsed.error.errors[0]?.message, success: false }

  const token = await getAccessToken()
  const insforge = createInsForgeServerClient(token!)

  const { data: existing } = await insforge.database
    .from('user_settings')
    .select('user_id')
    .eq('user_id', user.id)
    .limit(1)

  const payload = {
    main_currency_id: parsed.data.main_currency_id,
    updated_at: new Date().toISOString()
  }

  const { error } = existing?.[0]
    ? await insforge.database
        .from('user_settings')
        .update(payload)
        .eq('user_id', user.id)
    : await insforge.database
        .from('user_settings')
        .insert({ ...payload, user_id: user.id })

  if (error) return { error: error.message, success: false }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/settings')
  revalidatePath('/dashboard/accounts')
  return { success: true }
}
