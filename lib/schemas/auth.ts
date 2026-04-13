import { z } from 'zod'

export const signInSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required')
})

export const signUpSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  name: z.string().min(1, 'Full name is required'),
  password: z.string().min(6, 'Password must be at least 6 characters')
})

export const verifyEmailSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  otp: z.string().regex(/^\d{6}$/, 'Enter a 6-digit code')
})

export type SignInValues = z.infer<typeof signInSchema>
export type SignUpValues = z.infer<typeof signUpSchema>
export type VerifyEmailValues = z.infer<typeof verifyEmailSchema>
