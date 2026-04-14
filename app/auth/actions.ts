'use server'

import { createInsForgeServerClient, setAuthCookies, clearAuthCookies } from '@/lib/insforge/server'
import { redirect } from 'next/navigation'
import type { SignInValues, SignUpValues, VerifyEmailValues } from '@/lib/schemas/auth'

export async function signUpAction(values: SignUpValues) {
  const insforge = createInsForgeServerClient()
  const { data, error } = await insforge.auth.signUp(values)

  if (error) {
    return { error: error.message, success: false }
  }

  if (data?.requireEmailVerification) {
    return { email: values.email, requireVerification: true, success: true }
  }

  // If no verification required, they are signed in (not likely based on our config, but handled just in case)
  if (data?.accessToken && data?.refreshToken) {
    await setAuthCookies(data.accessToken, data.refreshToken)
    return { redirect: '/', success: true }
  }

  return { error: 'An unexpected error occurred during sign up.', success: false }
}

export async function verifyEmailAction(values: VerifyEmailValues) {
  const insforge = createInsForgeServerClient()
  const { data, error } = await insforge.auth.verifyEmail(values)

  // Data should contain user, accessToken and refreshToken
  if (error || !data?.accessToken || !data?.refreshToken) {
    return { error: error?.message ?? 'Invalid code.', success: false }
  }

  await setAuthCookies(data.accessToken, data.refreshToken)
  return { success: true }
}

export async function signInAction(values: SignInValues) {
  const insforge = createInsForgeServerClient()
  const { data, error } = await insforge.auth.signInWithPassword(values)

  if (error || !data?.accessToken || !data?.refreshToken) {
    if (error?.statusCode === 403) {
      // Email not verified
      return { error: 'Email not verified.', requireVerification: true, success: false }
    }
    return { error: error?.message ?? 'Sign in failed.', success: false }
  }

  await setAuthCookies(data.accessToken, data.refreshToken)
  return { success: true }
}

export async function exchangeOAuthCodeAction(code: string, codeVerifier: string) {
  const insforge = createInsForgeServerClient()
  const { data, error } = await insforge.auth.exchangeOAuthCode(code, codeVerifier)

  if (error || !data?.accessToken || !data?.refreshToken) {
    return { error: error?.message ?? 'Google sign in failed.', success: false }
  }

  await setAuthCookies(data.accessToken, data.refreshToken)
  return { success: true }
}

export async function signOutAction() {
  const insforge = createInsForgeServerClient()
  await insforge.auth.signOut()
  await clearAuthCookies()
  redirect('/')
}
