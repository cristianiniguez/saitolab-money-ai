'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { HandCoinsIcon, PlusIcon, UploadIcon } from 'lucide-react'
import { type Loan } from '@/lib/schemas/loans'
import { type Account } from '@/lib/schemas/accounts'
import { type Contact } from '@/lib/schemas/contacts'
import { LoanRow } from './loan-row'
import { LoanModal } from './loan-modal'
import { ImportCsvModal } from './import-csv-modal'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

interface LoansClientProps {
  loans: Loan[]
  accounts: Account[]
  contacts: Contact[]
  currencySymbol: string
  mainCurrencyId: string | null
}

function TableHead() {
  return (
    <thead>
      <tr className="border-b border-border bg-muted/50">
        <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
        <th className="px-4 py-3 text-left font-medium text-muted-foreground">Description</th>
        <th className="px-4 py-3 text-left font-medium text-muted-foreground">Contact</th>
        <th className="px-4 py-3 text-left font-medium text-muted-foreground">Account</th>
        <th className="px-4 py-3 text-left font-medium text-muted-foreground">Direction</th>
        <th className="px-4 py-3 text-right font-medium text-muted-foreground">Amount</th>
        <th className="px-4 py-3" />
      </tr>
    </thead>
  )
}

function TableRowSkeleton() {
  return (
    <tr className="border-b border-border">
      <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
      <td className="px-4 py-3"><Skeleton className="h-4 w-32" /></td>
      <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
      <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
      <td className="px-4 py-3"><Skeleton className="h-5 w-16 rounded-full" /></td>
      <td className="px-4 py-3"><Skeleton className="h-4 w-16 ml-auto" /></td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1.5">
          <Skeleton className="size-6 rounded-md" />
          <Skeleton className="size-6 rounded-md" />
        </div>
      </td>
    </tr>
  )
}

export function LoansClient({ loans, accounts, contacts, currencySymbol, mainCurrencyId }: LoansClientProps) {
  const router = useRouter()
  const [isRefreshing, startRefreshTransition] = useTransition()
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null)
  const [importModalOpen, setImportModalOpen] = useState(false)

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

  const skeletonCount = Math.max(loans.length, 1)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Loans</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setImportModalOpen(true)} disabled={isRefreshing}>
            <UploadIcon />
            Import CSV
          </Button>
          <Button onClick={openCreate} disabled={isRefreshing}>
            <PlusIcon />
            New Loan
          </Button>
        </div>
      </div>

      {isRefreshing
        ? (
            <div className="overflow-hidden rounded-xl ring-1 ring-foreground/10">
              <table className="w-full text-sm">
                <TableHead />
                <tbody>
                  {Array.from({ length: skeletonCount }).map((_, i) => (
                    <TableRowSkeleton key={i} />
                  ))}
                </tbody>
              </table>
            </div>
          )
        : loans.length === 0
          ? (
              <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border bg-muted/20 py-20 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <HandCoinsIcon className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="space-y-1">
                  <p className="font-medium text-foreground">No loans yet</p>
                  <p className="text-sm text-muted-foreground">
                    Track money you lend to or borrow from your contacts.
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
                  <TableHead />
                  <tbody>
                    {loans.map(loan => (
                      <LoanRow
                        key={loan.id}
                        loan={loan}
                        currencySymbol={currencySymbol}
                        onEdit={() => openEdit(loan)}
                        onSuccess={handleSuccess}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}

      <LoanModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        loan={selectedLoan}
        contacts={contacts}
        accounts={accounts}
        mainCurrencyId={mainCurrencyId}
        onSuccess={handleSuccess}
      />
      <ImportCsvModal
        open={importModalOpen}
        onOpenChange={setImportModalOpen}
        onSuccess={handleSuccess}
      />
    </div>
  )
}
