import { redirect } from 'next/navigation'
import { getCurrentUser, getAccessToken, createInsForgeServerClient } from '@/lib/insforge/server'
import { type Account } from '@/lib/schemas/accounts'
import { AccountsClient } from './accounts-client'

export default async function AccountsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/sign-in')

  const token = await getAccessToken()
  const insforge = createInsForgeServerClient(token!)

  const [{ data: accounts }, { data: transactions }] = await Promise.all([
    insforge.database
      .from('accounts')
      .select('*')
      .eq('user_id', user.id),
    insforge.database
      .from('transactions')
      .select('amount, type, account_id')
      .eq('user_id', user.id)
  ])

  const txList = (transactions ?? []) as { amount: number, type: string, account_id: string }[]
  const balances: Record<string, number> = {}
  for (const tx of txList) {
    balances[tx.account_id] = (balances[tx.account_id] ?? 0) + (tx.type === 'income' ? tx.amount : -tx.amount)
  }

  return (
    <div className="flex flex-col flex-1 bg-muted/20 font-sans p-8">
      <main className="w-full max-w-5xl mx-auto py-8">
        <AccountsClient accounts={(accounts as Account[]) ?? []} balances={balances} />
      </main>
    </div>
  )
}
