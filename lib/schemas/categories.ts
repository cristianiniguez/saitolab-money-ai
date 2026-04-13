import { z } from 'zod'

export const categorySchema = z.object({
  name: z.string().min(1, 'Name is required')
})

export type CategoryValues = z.infer<typeof categorySchema>

export interface Category extends CategoryValues {
  id: string
  user_id: string
  created_at: string
}
