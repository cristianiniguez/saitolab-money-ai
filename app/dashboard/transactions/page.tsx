import { redirect } from 'next/navigation'
import { getCurrentUser, getAccessToken, createInsForgeServerClient } from '@/lib/insforge/server'
import { type Transaction } from '@/lib/schemas/transactions'
import { type Account } from '@/lib/schemas/accounts'
import { type Category } from '@/lib/schemas/categories'
import { TransactionsClient } from './transactions-client'

export default async function TransactionsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/sign-in')

  const token = await getAccessToken()
  const insforge = createInsForgeServerClient(token!)

  const [{ data: transactions }, { data: accounts }, { data: categories }] = await Promise.all([
    insforge.database
      .from('transactions')
      .select('*, accounts(name), categories(name)')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(10),
    insforge.database
      .from('accounts')
      .select('*')
      .eq('user_id', user.id),
    insforge.database
      .from('categories')
      .select('*')
      .eq('user_id', user.id)
  ])

  return (
    <div className="flex flex-col flex-1 bg-muted/20 font-sans p-8">
      <main className="w-full max-w-5xl mx-auto py-8">
        <TransactionsClient
          transactions={(transactions as Transaction[]) ?? []}
          accounts={(accounts as Account[]) ?? []}
          categories={(categories as Category[]) ?? []}
        />
      </main>
    </div>
  )
}
