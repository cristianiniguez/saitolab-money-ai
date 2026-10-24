import { redirect } from 'next/navigation'
import { getCurrentUser, getAccessToken, createInsForgeServerClient } from '@/lib/insforge/server'
import { type Loan } from '@/lib/schemas/loans'
import { type Account } from '@/lib/schemas/accounts'
import { type Contact } from '@/lib/schemas/contacts'
import { LoansClient } from './loans-client'

export default async function LoansPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/sign-in')

  const token = await getAccessToken()
  const insforge = createInsForgeServerClient(token!)

  const [{ data: loans }, { data: accounts }, { data: contacts }, { data: userSettings }] = await Promise.all([
    insforge.database
      .from('loans')
      .select('*, contacts(name), accounts(name)')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(10),
    insforge.database
      .from('accounts')
      .select('*')
      .eq('user_id', user.id),
    insforge.database
      .from('contacts')
      .select('*')
      .eq('user_id', user.id),
    insforge.database
      .from('user_settings')
      .select('main_currency_id, currencies(symbol)')
      .eq('user_id', user.id)
      .limit(1)
  ])

  // Loans are recorded in the user's main currency.
  const settingsRow = (userSettings as { main_currency_id: string | null, currencies: { symbol: string } | null }[] | null)?.[0]
  const currencySymbol = settingsRow?.currencies?.symbol ?? 'USD'
  const mainCurrencyId = settingsRow?.main_currency_id ?? null

  return (
    <div className="flex flex-col flex-1 bg-muted/20 font-sans p-8">
      <main className="w-full max-w-5xl mx-auto py-8">
        <LoansClient
          loans={(loans as Loan[]) ?? []}
          accounts={(accounts as Account[]) ?? []}
          contacts={(contacts as Contact[]) ?? []}
          currencySymbol={currencySymbol}
          mainCurrencyId={mainCurrencyId}
        />
      </main>
    </div>
  )
}
