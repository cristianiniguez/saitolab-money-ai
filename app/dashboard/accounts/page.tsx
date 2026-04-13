import { redirect } from 'next/navigation'
import { getCurrentUser, getAccessToken, createInsForgeServerClient } from '@/lib/insforge/server'
import { type Account } from '@/lib/schemas/accounts'
import { AccountsClient } from './accounts-client'

export default async function AccountsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/sign-in')

  const token = await getAccessToken()
  const insforge = createInsForgeServerClient(token!)
  const { data: accounts } = await insforge.database
    .from('accounts')
    .select('*')
    .eq('user_id', user.id)

  return (
    <div className="flex flex-col flex-1 bg-muted/20 font-sans p-8">
      <main className="w-full max-w-5xl mx-auto py-8">
        <AccountsClient accounts={(accounts as Account[]) ?? []} />
      </main>
    </div>
  )
}
