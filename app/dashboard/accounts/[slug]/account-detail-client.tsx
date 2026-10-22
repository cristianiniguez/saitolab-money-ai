'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ReceiptIcon } from 'lucide-react'
import { type Account } from '@/lib/schemas/accounts'
import { type Category } from '@/lib/schemas/categories'
import { type Contact } from '@/lib/schemas/contacts'
import { type Transaction } from '@/lib/schemas/transactions'
import { type Transfer } from '@/lib/schemas/transfers'
import { type Loan } from '@/lib/schemas/loans'
import { type ActivityItem } from '@/lib/activity'
import { convertCurrency } from '@/lib/utils/currency'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ActivityRow } from './activity-row'
import { TransactionModal } from '@/app/dashboard/transactions/transaction-modal'
import { TransferModal } from './transfer-modal'
import { LoanModal } from '@/app/dashboard/contacts/[slug]/loan-modal'

const TYPE_BADGE: Record<Account['type'], { label: string, className: string }> = {
  bank: { className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', label: 'Bank' },
  crypto: { className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', label: 'Crypto' },
  wallet: { className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', label: 'Wallet' }
}

const fmt = (n: number, currencySymbol = 'USD') => {
  try {
    return new Intl.NumberFormat('en-US', { currency: currencySymbol, style: 'currency' }).format(n)
  }
  catch {
    return `${currencySymbol} ${n.toFixed(2)}`
  }
}

interface AccountDetailClientProps {
  account: Account
  balance: number
  items: ActivityItem[]
  accounts: Account[]
  categories: Category[]
  contacts: Contact[]
  mainCurrency?: { symbol: string; slug: string; rate_usd: number } | null
}

export function AccountDetailClient({ account, balance, items, accounts, categories, contacts, mainCurrency }: AccountDetailClientProps) {
  const router = useRouter()
  const [, startRefreshTransition] = useTransition()

  const [transactionModalOpen, setTransactionModalOpen] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [transferModalOpen, setTransferModalOpen] = useState(false)
  const [selectedTransfer, setSelectedTransfer] = useState<Transfer | null>(null)
  const [loanModalOpen, setLoanModalOpen] = useState(false)
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null)

  const badge = TYPE_BADGE[account.type]
  const accountRateUsd = account.currencies?.rate_usd ?? 1
  const showConverted =
    mainCurrency != null &&
    account.currencies != null &&
    mainCurrency.slug !== account.currencies.symbol.toLowerCase()

  const handleSuccess = () => {
    startRefreshTransition(() => {
      router.refresh()
    })
  }

  const openEdit = (item: ActivityItem) => {
    if (item.kind === 'transaction') setSelectedTransaction(item.raw)
    else if (item.kind === 'transfer') setSelectedTransfer(item.raw)
    else setSelectedLoan(item.raw)

    if (item.kind === 'transaction') setTransactionModalOpen(true)
    else if (item.kind === 'transfer') setTransferModalOpen(true)
    else setLoanModalOpen(true)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{account.name}</h1>
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.className}`}>
          {badge.label}
        </span>
        {account.currencies && (
          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-muted text-muted-foreground">
            {account.currencies.symbol}
          </span>
        )}
      </div>

      {/* Balance card */}
      <Card className="rounded-xl bg-muted/50 border-0 shadow-none w-fit min-w-48">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Balance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`text-3xl font-bold ${balance < 0 ? 'text-destructive' : 'text-foreground'}`}>
            {fmt(balance, account.currencies?.symbol)}
          </div>
          {showConverted && (
            <div className="text-sm text-muted-foreground mt-1 tabular-nums">
              ≈ {fmt(convertCurrency(balance, accountRateUsd, mainCurrency!.rate_usd), mainCurrency!.symbol)}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Activity section */}
      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">Last 10 activity</h2>

        {items.length === 0
          ? (
              <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border bg-muted/20 py-20 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <ReceiptIcon className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="space-y-1">
                  <p className="font-medium text-foreground">No activity yet</p>
                  <p className="text-sm text-muted-foreground">
                    Transactions, transfers and loans for this account will appear here.
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
                          <th className="px-4 py-3 text-left font-medium text-muted-foreground">Detail</th>
                          <th className="px-4 py-3 text-left font-medium text-muted-foreground">Type</th>
                          <th className="px-4 py-3 text-right font-medium text-muted-foreground">Amount</th>
                          <th className="px-4 py-3" />
                        </tr>
                      </thead>
                      <tbody>
                        {items.map(item => (
                          <ActivityRow
                            key={`${item.kind}-${item.id}`}
                            item={item}
                            currencySymbol={account.currencies?.symbol}
                            onEdit={openEdit}
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
                    {items.map((item, index) => {
                      const formattedDate = new Date(item.date.length > 10 ? item.date : `${item.date}T00:00:00`).toLocaleDateString('en-US', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })
                      const isLast = index === items.length - 1
                      const isPositive = item.signedAmount >= 0

                      return (
                        <div key={`${item.kind}-${item.id}`} className="flex gap-4">
                          {/* Timeline spine */}
                          <div className="flex flex-col items-center">
                            <div className={`mt-1 size-3 shrink-0 rounded-full ${isPositive ? 'bg-green-500' : 'bg-red-500'}`} />
                            {!isLast && <div className="w-px flex-1 bg-border my-1" />}
                          </div>

                          {/* Content */}
                          <div className="flex flex-1 items-start justify-between gap-4 pb-4">
                            <div className="flex flex-col gap-0.5">
                              <span className="text-sm font-medium text-foreground">{item.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {formattedDate}
                                {' · '}{item.typeLabel}
                                {item.detailLabel ? ` · ${item.detailLabel}` : ''}
                              </span>
                            </div>
                            <span className={`text-sm font-semibold tabular-nums shrink-0 ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                              {isPositive ? '+' : '-'}{fmt(Math.abs(item.signedAmount), account.currencies?.symbol)}
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

      <TransactionModal
        open={transactionModalOpen}
        onOpenChange={setTransactionModalOpen}
        transaction={selectedTransaction}
        accounts={accounts}
        categories={categories}
        onSuccess={handleSuccess}
      />
      <TransferModal
        open={transferModalOpen}
        onOpenChange={setTransferModalOpen}
        transfer={selectedTransfer}
        accounts={accounts}
        onSuccess={handleSuccess}
      />
      <LoanModal
        open={loanModalOpen}
        onOpenChange={setLoanModalOpen}
        contacts={contacts}
        loan={selectedLoan}
        accounts={accounts}
        onSuccess={handleSuccess}
      />
    </div>
  )
}
