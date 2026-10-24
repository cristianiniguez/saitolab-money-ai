import { redirect } from 'next/navigation'
import { getCurrentUser, getAccessToken, createInsForgeServerClient } from '@/lib/insforge/server'
import { type Transfer } from '@/lib/schemas/transfers'
import { type Account } from '@/lib/schemas/accounts'
import { TransfersClient } from './transfers-client'

export default async function TransfersPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/sign-in')

  const token = await getAccessToken()
  const insforge = createInsForgeServerClient(token!)

  const [{ data: transfers }, { data: accounts }] = await Promise.all([
    insforge.database
      .from('transfers')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(10),
    insforge.database
      .from('accounts')
      .select('*')
      .eq('user_id', user.id)
  ])

  return (
    <div className="flex flex-col flex-1 bg-muted/20 font-sans p-8">
      <main className="w-full max-w-5xl mx-auto py-8">
        <TransfersClient
          transfers={(transfers as Transfer[]) ?? []}
          accounts={(accounts as Account[]) ?? []}
        />
      </main>
    </div>
  )
}
