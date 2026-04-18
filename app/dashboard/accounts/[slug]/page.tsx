import { notFound, redirect } from 'next/navigation'
import { getCurrentUser, getAccessToken, createInsForgeServerClient } from '@/lib/insforge/server'
import { type Account } from '@/lib/schemas/accounts'
import { type Transaction } from '@/lib/schemas/transactions'
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
    .select('*')
    .eq('slug', slug)
    .eq('user_id', user.id)
    .single()

  if (!account) notFound()

  const [{ data: allTransactions }, { data: recentTransactions }] = await Promise.all([
    insforge.database
      .from('transactions')
      .select('amount, type')
      .eq('account_id', (account as Account).id)
      .eq('user_id', user.id),
    insforge.database
      .from('transactions')
      .select('*, accounts(name), categories(name)')
      .eq('account_id', (account as Account).id)
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(10)
  ])

  const txList = (allTransactions ?? []) as { amount: number, type: string }[]
  const balance = txList.reduce((sum, tx) => {
    return tx.type === 'income' ? sum + tx.amount : sum - tx.amount
  }, 0)

  return (
    <div className="flex flex-col flex-1 bg-muted/20 font-sans p-8">
      <main className="w-full max-w-5xl mx-auto py-8">
        <AccountDetailClient
          account={account as Account}
          balance={balance}
          transactions={(recentTransactions as Transaction[]) ?? []}
        />
      </main>
    </div>
  )
}
