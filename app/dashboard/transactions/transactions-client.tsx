'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { PlusIcon, ReceiptIcon, UploadIcon } from 'lucide-react'
import { type Transaction } from '@/lib/schemas/transactions'
import { type Account } from '@/lib/schemas/accounts'
import { type Category } from '@/lib/schemas/categories'
import { TransactionRow } from './transaction-row'
import { TransactionModal } from './transaction-modal'
import { ImportCsvModal } from './import-csv-modal'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

interface TransactionsClientProps {
  transactions: Transaction[]
  accounts: Account[]
  categories: Category[]
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

export function TransactionsClient({ transactions, accounts, categories }: TransactionsClientProps) {
  const router = useRouter()
  const [isRefreshing, startRefreshTransition] = useTransition()
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [importModalOpen, setImportModalOpen] = useState(false)

  const handleSuccess = () => {
    startRefreshTransition(() => {
      router.refresh()
    })
  }

  const openCreate = () => {
    setSelectedTransaction(null)
    setModalOpen(true)
  }

  const openEdit = (transaction: Transaction) => {
    setSelectedTransaction(transaction)
    setModalOpen(true)
  }

  const skeletonCount = Math.max(transactions.length, 1)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Transactions</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setImportModalOpen(true)} disabled={isRefreshing}>
            <UploadIcon />
            Import CSV
          </Button>
          <Button onClick={openCreate} disabled={isRefreshing}>
            <PlusIcon />
            New Transaction
          </Button>
        </div>
      </div>

      {isRefreshing
        ? (
            <div className="overflow-hidden rounded-xl ring-1 ring-foreground/10">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Account</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Category</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Type</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Amount</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: skeletonCount }).map((_, i) => (
                    <TableRowSkeleton key={i} />
                  ))}
                </tbody>
              </table>
            </div>
          )
        : transactions.length === 0
          ? (
              <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border bg-muted/20 py-20 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <ReceiptIcon className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="space-y-1">
                  <p className="font-medium text-foreground">No transactions yet</p>
                  <p className="text-sm text-muted-foreground">
                    Record your first income or expense to start tracking your finances.
                  </p>
                </div>
                <Button onClick={openCreate}>
                  <PlusIcon />
                  Create your first transaction
                </Button>
              </div>
            )
          : (
              <div className="overflow-hidden rounded-xl ring-1 ring-foreground/10">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Account</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Category</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Type</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">Amount</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map(transaction => (
                      <TransactionRow
                        key={transaction.id}
                        transaction={transaction}
                        onEdit={() => openEdit(transaction)}
                        onSuccess={handleSuccess}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}

      <TransactionModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        transaction={selectedTransaction}
        accounts={accounts}
        categories={categories}
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
