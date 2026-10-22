'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { PlusIcon, HandCoinsIcon } from 'lucide-react'
import { type Contact } from '@/lib/schemas/contacts'
import { type Loan } from '@/lib/schemas/loans'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LoanModal } from './loan-modal'
import { LoanRow } from './loan-row'

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Math.abs(n))

interface ContactDetailClientProps {
  contact: Contact
  balance: number
  loans: Loan[]
}

export function ContactDetailClient({ contact, balance, loans }: ContactDetailClientProps) {
  const router = useRouter()
  const [, startRefreshTransition] = useTransition()
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null)

  const handleSuccess = () => {
    startRefreshTransition(() => {
      router.refresh()
    })
  }

  const openCreate = () => {
    setSelectedLoan(null)
    setModalOpen(true)
  }

  const openEdit = (loan: Loan) => {
    setSelectedLoan(loan)
    setModalOpen(true)
  }

  const balanceLabel = balance === 0 ? 'Settled' : balance > 0 ? 'Owes you' : 'You owe'

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{contact.name}</h1>
        <Button onClick={openCreate}>
          <PlusIcon />
          New Loan
        </Button>
      </div>

      <Card className="rounded-xl bg-muted/50 border-0 shadow-none w-fit min-w-48">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Balance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`text-3xl font-bold ${balance < 0 ? 'text-destructive' : 'text-foreground'}`}>
            {fmt(balance)}
          </div>
          <span className="text-xs text-muted-foreground">{balanceLabel}</span>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">Loans</h2>

        {loans.length === 0
          ? (
              <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border bg-muted/20 py-20 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <HandCoinsIcon className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="space-y-1">
                  <p className="font-medium text-foreground">No loans yet</p>
                  <p className="text-sm text-muted-foreground">
                    Loans with {contact.name} will appear here.
                  </p>
                </div>
                <Button onClick={openCreate}>
                  <PlusIcon />
                  Create your first loan
                </Button>
              </div>
            )
          : (
              <div className="overflow-hidden rounded-xl ring-1 ring-foreground/10">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Description</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Direction</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">Amount</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {loans.map(loan => (
                      <LoanRow
                        key={loan.id}
                        loan={loan}
                        onEdit={() => openEdit(loan)}
                        onSuccess={handleSuccess}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
      </div>

      <LoanModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        contactId={contact.id}
        loan={selectedLoan}
        onSuccess={handleSuccess}
      />
    </div>
  )
}
