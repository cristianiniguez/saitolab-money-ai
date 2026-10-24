import { notFound, redirect } from 'next/navigation'
import { getCurrentUser, getAccessToken, createInsForgeServerClient } from '@/lib/insforge/server'
import { type Account } from '@/lib/schemas/accounts'
import { type Transaction } from '@/lib/schemas/transactions'
import { type Transfer } from '@/lib/schemas/transfers'
import { type Loan } from '@/lib/schemas/loans'
import { type Category } from '@/lib/schemas/categories'
import { type Contact } from '@/lib/schemas/contacts'
import { buildActivityFeed, sumActivity } from '@/lib/activity'
import { AccountDetailClient } from './account-detail-client'

interface AccountDetailPageProps {
  params: Promise<{ slug: string }>
}

export default async function AccountDetailPage({ params }: AccountDetailPageProps) {
  const { slug } = await params

  const user = await getCurrentUser()
  if (!user) redirect('/sign-in')

  const token = await getAccessToken()
  const insforge = createInsForgeServerClient(token!)

  const { data: account } = await insforge.database
    .from('accounts')
    .select('*, currencies(id, name, symbol, rate_usd)')
    .eq('slug', slug)
    .eq('user_id', user.id)
    .single()

  if (!account) notFound()

  const accountId = (account as Account).id

  const [
    { data: transactions },
    { data: transfers },
    { data: loans },
    { data: accounts },
    { data: categories },
    { data: contacts },
    { data: userSettings }
  ] = await Promise.all([
    insforge.database
      .from('transactions')
      .select('*, accounts(name), categories(name)')
      .eq('account_id', accountId)
      .eq('user_id', user.id),
    insforge.database
      .from('transfers')
      .select('*')
      .eq('user_id', user.id)
      .or(`from_account_id.eq.${accountId},to_account_id.eq.${accountId}`),
    insforge.database
      .from('loans')
      .select('*, contacts(name), accounts(name)')
      .eq('account_id', accountId)
      .eq('user_id', user.id),
    insforge.database
      .from('accounts')
      .select('*')
      .eq('user_id', user.id),
    insforge.database
      .from('categories')
      .select('*')
      .eq('user_id', user.id),
    insforge.database
      .from('contacts')
      .select('*')
      .eq('user_id', user.id),
    insforge.database
      .from('user_settings')
      .select('currencies(symbol, slug, rate_usd)')
      .eq('user_id', user.id)
      .limit(1)
  ])

  type MainCurrencyRow = { currencies: { symbol: string; slug: string; rate_usd: number } | null }
  const mainCurrency = (userSettings as MainCurrencyRow[] | null)?.[0]?.currencies ?? null

  const accountList = (accounts as Account[]) ?? []
  const accountNames = new Map(accountList.map(a => [a.id, a.name]))

  const feedItems = buildActivityFeed(
    (transactions as Transaction[]) ?? [],
    (transfers as Transfer[]) ?? [],
    (loans as Loan[]) ?? [],
    accountId,
    accountNames
  )

  const balance = Number((account as Account).initial_amount ?? 0) + sumActivity(feedItems)
  const recentItems = feedItems.slice(0, 10)

  return (
    <div className="flex flex-col flex-1 bg-muted/20 font-sans p-8">
      <main className="w-full max-w-5xl mx-auto py-8">
        <AccountDetailClient
          account={account as Account}
          balance={balance}
          items={recentItems}
          accounts={accountList}
          categories={(categories as Category[]) ?? []}
          contacts={(contacts as Contact[]) ?? []}
          mainCurrency={mainCurrency}
        />
      </main>
    </div>
  )
}
