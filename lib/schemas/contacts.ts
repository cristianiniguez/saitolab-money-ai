import { z } from 'zod'

export const contactSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().regex(/^[a-z0-9-]*$/, 'Invalid slug').min(1, 'Slug is required')
})

export type ContactValues = z.infer<typeof contactSchema>

export interface Contact extends ContactValues {
  id: string
  user_id: string
  created_at: string
}
