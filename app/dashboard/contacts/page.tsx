import { redirect } from 'next/navigation'
import { getCurrentUser, getAccessToken, createInsForgeServerClient } from '@/lib/insforge/server'
import { type Contact } from '@/lib/schemas/contacts'
import { ContactsClient } from './contacts-client'

export default async function ContactsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/sign-in')

  const token = await getAccessToken()
  const insforge = createInsForgeServerClient(token!)

  const [{ data: contacts }, { data: loans }, { data: userSettings }] = await Promise.all([
    insforge.database
      .from('contacts')
      .select('*')
      .eq('user_id', user.id),
    insforge.database
      .from('loans')
      .select('amount, direction, contact_id')
      .eq('user_id', user.id),
    insforge.database
      .from('user_settings')
      .select('currencies(symbol)')
      .eq('user_id', user.id)
      .limit(1)
  ])

  // Loans are recorded in the user's main currency.
  const currencySymbol = (userSettings as { currencies: { symbol: string } | null }[] | null)?.[0]?.currencies?.symbol ?? 'USD'

  const loanList = (loans ?? []) as { amount: number, direction: string, contact_id: string }[]
  const balances: Record<string, number> = {}
  for (const loan of loanList) {
    balances[loan.contact_id] = (balances[loan.contact_id] ?? 0) + (loan.direction === 'lent' ? loan.amount : -loan.amount)
  }

  return (
    <div className="flex flex-col flex-1 bg-muted/20 font-sans p-8">
      <main className="w-full max-w-5xl mx-auto py-8">
        <ContactsClient contacts={(contacts as Contact[]) ?? []} balances={balances} currencySymbol={currencySymbol} />
      </main>
    </div>
  )
}
