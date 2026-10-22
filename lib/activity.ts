import { type Transaction } from '@/lib/schemas/transactions'
import { type Transfer } from '@/lib/schemas/transfers'
import { type Loan } from '@/lib/schemas/loans'

export type ActivityKind = 'transaction' | 'transfer' | 'loan'

interface ActivityItemBase {
  id: string
  date: string
  name: string
  signedAmount: number
  typeLabel: string
  detailLabel: string | null
}

export type ActivityItem
  = (ActivityItemBase & { kind: 'transaction', raw: Transaction })
    | (ActivityItemBase & { kind: 'transfer', raw: Transfer })
    | (ActivityItemBase & { kind: 'loan', raw: Loan })

export function transactionToActivity(t: Transaction): ActivityItem {
  return {
    kind: 'transaction',
    id: t.id,
    date: t.date,
    name: t.name,
    signedAmount: t.type === 'income' ? t.amount : -t.amount,
    typeLabel: t.type === 'income' ? 'Income' : 'Expense',
    detailLabel: t.categories?.name ?? null,
    raw: t
  }
}

export function transferToActivity(
  t: Transfer,
  accountId: string,
  accountNames: Map<string, string>
): ActivityItem {
  const isSource = t.from_account_id === accountId
  const counterpartId = isSource ? t.to_account_id : t.from_account_id
  return {
    kind: 'transfer',
    id: t.id,
    date: t.date,
    name: t.name,
    signedAmount: isSource ? -t.amount : t.to_amount,
    typeLabel: 'Transfer',
    detailLabel: accountNames.get(counterpartId) ?? null,
    raw: t
  }
}

export function loanToActivity(l: Loan): ActivityItem {
  return {
    kind: 'loan',
    id: l.id,
    date: l.date,
    name: l.description || (l.direction === 'lent' ? 'Loan lent' : 'Loan borrowed'),
    signedAmount: l.direction === 'lent' ? -l.amount : l.amount,
    typeLabel: l.direction === 'lent' ? 'Lent' : 'Borrowed',
    detailLabel: l.contacts?.name ?? null,
    raw: l
  }
}

export function buildActivityFeed(
  transactions: Transaction[],
  transfers: Transfer[],
  loans: Loan[],
  accountId: string,
  accountNames: Map<string, string>
): ActivityItem[] {
  const items: ActivityItem[] = [
    ...transactions.map(transactionToActivity),
    ...transfers.map(t => transferToActivity(t, accountId, accountNames)),
    ...loans.map(loanToActivity)
  ]

  return items.sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1
    return a.raw.created_at < b.raw.created_at ? 1 : -1
  })
}

export function sumActivity(items: ActivityItem[]): number {
  return items.reduce((sum, item) => sum + item.signedAmount, 0)
}
