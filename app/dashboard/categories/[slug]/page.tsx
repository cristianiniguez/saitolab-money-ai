import { notFound, redirect } from 'next/navigation'
import { getCurrentUser, getAccessToken, createInsForgeServerClient } from '@/lib/insforge/server'
import { type Category } from '@/lib/schemas/categories'
import { type Transaction } from '@/lib/schemas/transactions'
import { type Account } from '@/lib/schemas/accounts'
import { CategoryDetailClient } from './category-detail-client'

interface CategoryDetailPageProps {
  params: Promise<{ slug: string }>
}

export default async function CategoryDetailPage({ params }: CategoryDetailPageProps) {
  const { slug } = await params

  const user = await getCurrentUser()
  if (!user) redirect('/sign-in')

  const token = await getAccessToken()
  const insforge = createInsForgeServerClient(token!)

  const { data: category } = await insforge.database
    .from('categories')
    .select('*')
    .eq('slug', slug)
    .eq('user_id', user.id)
    .single()

  if (!category) notFound()

  const [{ data: allTransactions }, { data: recentTransactions }, { data: accounts }, { data: categories }] = await Promise.all([
    insforge.database
      .from('transactions')
      .select('amount, type')
      .eq('category_id', (category as Category).id)
      .eq('user_id', user.id),
    insforge.database
      .from('transactions')
      .select('*, accounts(name, currencies(symbol)), categories(name)')
      .eq('category_id', (category as Category).id)
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

  const txList = (allTransactions ?? []) as { amount: number, type: string }[]
  const balance = txList.reduce((sum, tx) => {
    return tx.type === 'income' ? sum + tx.amount : sum - tx.amount
  }, 0)

  return (
    <div className="flex flex-col flex-1 bg-muted/20 font-sans p-8">
      <main className="w-full max-w-5xl mx-auto py-8">
        <CategoryDetailClient
          category={category as Category}
          balance={balance}
          transactions={(recentTransactions as Transaction[]) ?? []}
          accounts={(accounts as Account[]) ?? []}
          categories={(categories as Category[]) ?? []}
        />
      </main>
    </div>
  )
}
