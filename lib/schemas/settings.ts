import { z } from 'zod'

export const userSettingsSchema = z.object({
  main_currency_id: z.string().min(1, 'Main currency is required')
})

export type UserSettingsValues = z.infer<typeof userSettingsSchema>

export interface UserSettings extends UserSettingsValues {
  user_id: string
  created_at: string
  updated_at: string
  currencies?: { id: string; name: string; symbol: string; slug: string } | null
}
