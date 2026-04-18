'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ReceiptIcon } from 'lucide-react'
import { type Account } from '@/lib/schemas/accounts'
import { type Transaction } from '@/lib/schemas/transactions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { TransactionRow } from '@/app/dashboard/transactions/transaction-row'

const TYPE_BADGE: Record<Account['type'], { label: string, className: string }> = {
  bank: { className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', label: 'Bank' },
  crypto: { className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', label: 'Crypto' },
  wallet: { className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', label: 'Wallet' }
}

const TIMELINE_DOT: Record<Transaction['type'], string> = {
  income: 'bg-green-500',
  expense: 'bg-red-500'
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

interface AccountDetailClientProps {
  account: Account
  balance: number
  transactions: Transaction[]
}

export function AccountDetailClient({ account, balance, transactions }: AccountDetailClientProps) {
  const router = useRouter()
  const [, startRefreshTransition] = useTransition()

  const badge = TYPE_BADGE[account.type]

  const handleSuccess = () => {
    startRefreshTransition(() => {
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{account.name}</h1>
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.className}`}>
          {badge.label}
        </span>
      </div>

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
        <h2 className="text-lg font-semibold tracking-tight text-foreground">Last 10 transactions</h2>

        {transactions.length === 0
          ? (
              <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border bg-muted/20 py-20 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <ReceiptIcon className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="space-y-1">
                  <p className="font-medium text-foreground">No transactions yet</p>
                  <p className="text-sm text-muted-foreground">
                    Transactions for this account will appear here.
                  </p>
                </div>
              </div>
            )
          : (
              <Tabs defaultValue="table">
                <TabsList>
                  <TabsTrigger value="table">Table</TabsTrigger>
                  <TabsTrigger value="timeline">Timeline</TabsTrigger>
                </TabsList>

                {/* Table tab */}
                <TabsContent value="table">
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
                            onEdit={() => {}}
                            onSuccess={handleSuccess}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                </TabsContent>

                {/* Timeline tab */}
                <TabsContent value="timeline">
                  <div className="flex flex-col">
                    {transactions.map((transaction, index) => {
                      const formattedDate = new Date(transaction.date + 'T00:00:00').toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })
                      const isLast = index === transactions.length - 1

                      return (
                        <div key={transaction.id} className="flex gap-4">
                          {/* Timeline spine */}
                          <div className="flex flex-col items-center">
                            <div className={`mt-1 size-3 shrink-0 rounded-full ${TIMELINE_DOT[transaction.type]}`} />
                            {!isLast && <div className="w-px flex-1 bg-border my-1" />}
                          </div>

                          {/* Content */}
                          <div className={`flex flex-1 items-start justify-between gap-4 pb-4 ${isLast ? '' : ''}`}>
                            <div className="flex flex-col gap-0.5">
                              <span className="text-sm font-medium text-foreground">{transaction.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {formattedDate}
                                {transaction.categories?.name ? ` · ${transaction.categories.name}` : ''}
                              </span>
                            </div>
                            <span className={`text-sm font-semibold tabular-nums shrink-0 ${transaction.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                              {transaction.type === 'income' ? '+' : '-'}{fmt(transaction.amount)}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </TabsContent>
              </Tabs>
            )}
      </div>
    </div>
  )
}
