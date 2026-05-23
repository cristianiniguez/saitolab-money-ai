import { redirect } from 'next/navigation'
import { getCurrentUser, getAccessToken, createInsForgeServerClient } from '@/lib/insforge/server'
import { type UserSettings } from '@/lib/schemas/settings'
import { type Currency } from '@/lib/schemas/currencies'
import { SettingsClient } from './settings-client'

export default async function SettingsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/sign-in')

  const token = await getAccessToken()
  const insforge = createInsForgeServerClient(token!)

  const [{ data: settingsRows }, { data: currencies }] = await Promise.all([
    insforge.database
      .from('user_settings')
      .select('*, currencies(id, name, symbol, slug)')
      .eq('user_id', user.id)
      .limit(1),
    insforge.database
      .from('currencies')
      .select('id, name, symbol, slug')
      .order('name')
  ])

  return (
    <div className="flex flex-col flex-1 bg-muted/20 font-sans p-8">
      <main className="w-full max-w-2xl mx-auto py-8">
        <SettingsClient
          settings={(settingsRows?.[0] as UserSettings) ?? null}
          currencies={(currencies as Currency[]) ?? []}
        />
      </main>
    </div>
  )
}
