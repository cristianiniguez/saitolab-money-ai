import { createClient } from '@insforge/sdk'

export function createInsForgeClient() {
  return createClient({
    anonKey: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY!,
    baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!
  })
}
