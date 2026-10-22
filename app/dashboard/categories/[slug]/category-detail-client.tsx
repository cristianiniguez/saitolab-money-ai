'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { PlusIcon, ReceiptIcon } from 'lucide-react'
import { type Category } from '@/lib/schemas/categories'
import { type Transaction } from '@/lib/schemas/transactions'
import { type Account } from '@/lib/schemas/accounts'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TransactionRow } from '@/app/dashboard/transactions/transaction-row'
import { TransactionModal } from '@/app/dashboard/transactions/transaction-modal'

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

interface CategoryDetailClientProps {
  category: Category
  balance: number
  transactions: Transaction[]
  accounts: Account[]
  categories: Category[]
}

export function CategoryDetailClient({ category, balance, transactions, accounts, categories }: CategoryDetailClientProps) {
  const router = useRouter()
  const [, startRefreshTransition] = useTransition()
  const [transactionModalOpen, setTransactionModalOpen] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)

  const handleSuccess = () => {
    startRefreshTransition(() => {
      router.refresh()
    })
  }

  const openCreateTransaction = () => {
    setSelectedTransaction(null)
    setTransactionModalOpen(true)
  }

  const openEditTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction)
    setTransactionModalOpen(true)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <h1 className="text-2xl font-bold tracking-tight text-foreground">{category.name}</h1>

      {/* Balance card */}
      <Card className="rounded-xl bg-muted/50 border-0 shadow-none w-fit min-w-48">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Balance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`text-3xl font-bold ${balance < 0 ? 'text-destructive' : 'text-foreground'}`}>
            {fmt(balance)}
          </div>
        </CardContent>
      </Card>

      {/* Transactions section */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">Last 10 transactions</h2>
          <Button size="sm" variant="outline" onClick={openCreateTransaction}>
            <PlusIcon />
            Transaction
          </Button>
        </div>

        {transactions.length === 0
          ? (
              <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border bg-muted/20 py-20 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <ReceiptIcon className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="space-y-1">
                  <p className="font-medium text-foreground">No transactions yet</p>
                  <p className="text-sm text-muted-foreground">
                    Transactions for this category will appear here.
                  </p>
                </div>
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
                        onEdit={() => openEditTransaction(transaction)}
                        onSuccess={handleSuccess}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
      </div>

      <TransactionModal
        open={transactionModalOpen}
        onOpenChange={setTransactionModalOpen}
        transaction={selectedTransaction}
        defaultCategoryId={category.id}
        accounts={accounts}
        categories={categories}
        onSuccess={handleSuccess}
      />
    </div>
  )
}
