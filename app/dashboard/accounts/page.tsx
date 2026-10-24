import { redirect } from 'next/navigation'
import { getCurrentUser, getAccessToken, createInsForgeServerClient } from '@/lib/insforge/server'
import { type Account } from '@/lib/schemas/accounts'
import { type Currency } from '@/lib/schemas/currencies'
import { computeAccountBalances } from '@/lib/balances'
import { AccountsClient } from './accounts-client'

export default async function AccountsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/sign-in')

  const token = await getAccessToken()
  const insforge = createInsForgeServerClient(token!)

  const [
    { data: accounts },
    { data: transactions },
    { data: transfers },
    { data: loans },
    { data: currencies },
    { data: userSettings }
  ] = await Promise.all([
    insforge.database
      .from('accounts')
      .select('*, currencies(id, name, symbol, rate_usd)')
      .eq('user_id', user.id),
    insforge.database
      .from('transactions')
      .select('amount, type, account_id')
      .eq('user_id', user.id),
    insforge.database
      .from('transfers')
      .select('amount, to_amount, from_account_id, to_account_id')
      .eq('user_id', user.id),
    insforge.database
      .from('loans')
      .select('amount, direction, account_id')
      .eq('user_id', user.id),
    insforge.database
      .from('currencies')
      .select('id, name, symbol, slug, type')
      .order('name'),
    insforge.database
      .from('user_settings')
      .select('main_currency_id, currencies(symbol, slug, rate_usd)')
      .eq('user_id', user.id)
      .limit(1)
  ])

  type UserSettingsRow = { main_currency_id: string, currencies: { symbol: string, slug: string, rate_usd: number } | null }
  const settingsRow = (userSettings as UserSettingsRow[] | null)?.[0] ?? null
  const mainCurrencyId = settingsRow?.main_currency_id ?? null
  const mainCurrency = settingsRow?.currencies ?? null

  const balances = computeAccountBalances(
    (accounts as Account[]) ?? [],
    transactions ?? [],
    transfers ?? [],
    loans ?? []
  )

  return (
    <div className="flex flex-col flex-1 bg-muted/20 font-sans p-8">
      <main className="w-full max-w-5xl mx-auto py-8">
        <AccountsClient
          accounts={(accounts as Account[]) ?? []}
          balances={balances}
          currencies={(currencies as Currency[]) ?? []}
          mainCurrencyId={mainCurrencyId}
          mainCurrency={mainCurrency}
        />
      </main>
    </div>
  )
}
