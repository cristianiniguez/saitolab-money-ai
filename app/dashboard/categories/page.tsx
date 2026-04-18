import { redirect } from 'next/navigation'
import { getCurrentUser, getAccessToken, createInsForgeServerClient } from '@/lib/insforge/server'
import { type Category } from '@/lib/schemas/categories'
import { CategoriesClient } from './categories-client'

export default async function CategoriesPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/sign-in')

  const token = await getAccessToken()
  const insforge = createInsForgeServerClient(token!)

  const [{ data: categories }, { data: transactions }] = await Promise.all([
    insforge.database
      .from('categories')
      .select('*')
      .eq('user_id', user.id),
    insforge.database
      .from('transactions')
      .select('amount, type, category_id')
      .eq('user_id', user.id)
  ])

  const txList = (transactions ?? []) as { amount: number, type: string, category_id: string | null }[]
  const balances: Record<string, number> = {}
  for (const tx of txList) {
    if (!tx.category_id) continue
    balances[tx.category_id] = (balances[tx.category_id] ?? 0) + (tx.type === 'income' ? tx.amount : -tx.amount)
  }

  return (
    <div className="flex flex-col flex-1 bg-muted/20 font-sans p-8">
      <main className="w-full max-w-5xl mx-auto py-8">
        <CategoriesClient categories={(categories as Category[]) ?? []} balances={balances} />
      </main>
    </div>
  )
}
