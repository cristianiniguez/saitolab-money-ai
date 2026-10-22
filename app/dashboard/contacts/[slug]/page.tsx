import { notFound, redirect } from 'next/navigation'
import { getCurrentUser, getAccessToken, createInsForgeServerClient } from '@/lib/insforge/server'
import { type Account } from '@/lib/schemas/accounts'
import { type Contact } from '@/lib/schemas/contacts'
import { type Loan } from '@/lib/schemas/loans'
import { ContactDetailClient } from './contact-detail-client'

interface ContactDetailPageProps {
  params: Promise<{ slug: string }>
}

export default async function ContactDetailPage({ params }: ContactDetailPageProps) {
  const { slug } = await params

  const user = await getCurrentUser()
  if (!user) redirect('/sign-in')

  const token = await getAccessToken()
  const insforge = createInsForgeServerClient(token!)

  const { data: contact } = await insforge.database
    .from('contacts')
    .select('*')
    .eq('slug', slug)
    .eq('user_id', user.id)
    .single()

  if (!contact) notFound()

  const [{ data: loans }, { data: accounts }] = await Promise.all([
    insforge.database
      .from('loans')
      .select('*, contacts(name), accounts(name)')
      .eq('contact_id', (contact as Contact).id)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    insforge.database
      .from('accounts')
      .select('*')
      .eq('user_id', user.id)
  ])

  const loanList = (loans as Loan[]) ?? []
  const balance = loanList.reduce((sum, loan) => {
    return loan.direction === 'lent' ? sum + loan.amount : sum - loan.amount
  }, 0)

  return (
    <div className="flex flex-col flex-1 bg-muted/20 font-sans p-8">
      <main className="w-full max-w-5xl mx-auto py-8">
        <ContactDetailClient
          contact={contact as Contact}
          balance={balance}
          loans={loanList}
          accounts={(accounts as Account[]) ?? []}
        />
      </main>
    </div>
  )
}
