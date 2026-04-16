'use server'

import { revalidatePath } from 'next/cache'
import { createInsForgeServerClient, getCurrentUser, getAccessToken } from '@/lib/insforge/server'
import { categorySchema, type CategoryValues } from '@/lib/schemas/categories'

type ActionResult = { success: boolean, error?: string }

export async function createCategory(values: CategoryValues): Promise<ActionResult> {
  const user = await getCurrentUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const parsed = categorySchema.safeParse(values)
  if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message }

  const token = await getAccessToken()
  const insforge = createInsForgeServerClient(token!)
  const { error } = await insforge.database.from('categories').insert({
    name: parsed.data.name,
    slug: parsed.data.slug,
    user_id: user.id
  })

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard/categories')
  return { success: true }
}

export async function updateCategory(id: string, values: CategoryValues): Promise<ActionResult> {
  const user = await getCurrentUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const parsed = categorySchema.safeParse(values)
  if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message }

  const token = await getAccessToken()
  const insforge = createInsForgeServerClient(token!)
  const { error } = await insforge.database
    .from('categories')
    .update({ name: parsed.data.name, slug: parsed.data.slug })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard/categories')
  return { success: true }
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  const user = await getCurrentUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const token = await getAccessToken()
  const insforge = createInsForgeServerClient(token!)
  const { error } = await insforge.database
    .from('categories')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard/categories')
  return { success: true }
}
