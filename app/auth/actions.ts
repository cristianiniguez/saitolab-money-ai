'use server'

import { createInsForgeServerClient, setAuthCookies, clearAuthCookies } from '@/lib/insforge/server'
import { redirect } from 'next/navigation'

export async function signUpAction(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  const name = String(formData.get('name') ?? '').trim()

  const insforge = createInsForgeServerClient()
  const { data, error } = await insforge.auth.signUp({
    email,
    password,
    name
  })

  if (error) {
    return { success: false, error: error.message }
  }

  if (data?.requireEmailVerification) {
    return { success: true, requireVerification: true, email }
  }

  // If no verification required, they are signed in (not likely based on our config, but handled just in case)
  if (data?.accessToken && data?.refreshToken) {
    await setAuthCookies(data.accessToken, data.refreshToken)
    return { success: true, redirect: '/' }
  }

  return { success: false, error: 'An unexpected error occurred during sign up.' }
}

export async function verifyEmailAction(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim()
  const otp = String(formData.get('otp') ?? '').trim()

  const insforge = createInsForgeServerClient()
  const { data, error } = await insforge.auth.verifyEmail({
    email,
    otp
  })

  // Data should contain user, accessToken and refreshToken
  if (error || !data?.accessToken || !data?.refreshToken) {
    return { success: false, error: error?.message ?? 'Invalid code.' }
  }

  await setAuthCookies(data.accessToken, data.refreshToken)
  return { success: true }
}

export async function signInAction(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')

  const insforge = createInsForgeServerClient()
  const { data, error } = await insforge.auth.signInWithPassword({
    email,
    password
  })

  if (error || !data?.accessToken || !data?.refreshToken) {
    if (error?.statusCode === 403) {
      // Email not verified
      return { success: false, requireVerification: true, error: 'Email not verified.' }
    }
    return { success: false, error: error?.message ?? 'Sign in failed.' }
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
