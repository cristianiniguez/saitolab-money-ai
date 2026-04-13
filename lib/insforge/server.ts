import { createClient } from '@insforge/sdk'
import { cookies } from 'next/headers'

const accessCookie = 'insforge_access_token'
const refreshCookie = 'insforge_refresh_token'

const authCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/'
}

export function createInsForgeServerClient(accessToken?: string) {
  return createClient({
    baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!,
    anonKey: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY!,
    isServerMode: true,
    edgeFunctionToken: accessToken
  })
}

export async function setAuthCookies(accessToken: string, refreshToken: string) {
  const cookieStore = await cookies()
  cookieStore.set(accessCookie, accessToken, { ...authCookieOptions, maxAge: 60 * 15 })
  cookieStore.set(refreshCookie, refreshToken, { ...authCookieOptions, maxAge: 60 * 60 * 24 * 7 })
}

export async function clearAuthCookies() {
  const cookieStore = await cookies()
  cookieStore.delete(accessCookie)
  cookieStore.delete(refreshCookie)
}

export async function getCurrentUser() {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get(accessCookie)?.value
  if (!accessToken) return null

  const insforge = createInsForgeServerClient(accessToken)
  const { data, error } = await insforge.auth.getCurrentUser()
  if (error || !data?.user) return null

  return data.user
}
