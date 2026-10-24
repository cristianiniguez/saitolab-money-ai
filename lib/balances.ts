type BalanceAccount = { id: string, initial_amount: number }
type BalanceTransaction = { account_id: string, amount: number, type: string }
type BalanceTransfer = { from_account_id: string, to_account_id: string, amount: number, to_amount: number }
type BalanceLoan = { account_id: string | null, amount: number, direction: string }

// Balance per account = initial amount + transactions + transfers + loans.
// Signs match lib/activity.ts so list totals agree with the account detail feed.
export function computeAccountBalances(
  accounts: BalanceAccount[],
  transactions: BalanceTransaction[],
  transfers: BalanceTransfer[],
  loans: BalanceLoan[]
): Record<string, number> {
  const balances: Record<string, number> = {}
  const add = (accountId: string, amount: number) => {
    balances[accountId] = (balances[accountId] ?? 0) + Number(amount)
  }

  for (const account of accounts) add(account.id, account.initial_amount ?? 0)
  for (const tx of transactions) add(tx.account_id, tx.type === 'income' ? tx.amount : -tx.amount)
  for (const t of transfers) {
    add(t.from_account_id, -t.amount)
    add(t.to_account_id, t.to_amount)
  }
  for (const loan of loans) {
    if (loan.account_id) add(loan.account_id, loan.direction === 'lent' ? -loan.amount : loan.amount)
  }

  return balances
}

type DatedTransaction = BalanceTransaction & { date: string }
type DatedTransfer = BalanceTransfer & { date: string }
type DatedLoan = BalanceLoan & { date: string }

export type BalancePoint = { date: string, balance: number }

const toDateKey = (d: Date) => d.toISOString().slice(0, 10)

// Daily end-of-day total balance for the last `days` days (oldest first, ending today).
// Events dated before the window are folded into the starting balance.
// `factors` maps account id -> multiplier converting that account's currency to the target one.
export function computeBalanceHistory(
  accounts: BalanceAccount[],
  transactions: DatedTransaction[],
  transfers: DatedTransfer[],
  loans: DatedLoan[],
  days: number,
  factors: Record<string, number> = {},
  today = new Date()
): BalancePoint[] {
  const deltas: Record<string, number> = {}
  const add = (date: string, accountId: string, amount: number) => {
    const key = date.slice(0, 10)
    deltas[key] = (deltas[key] ?? 0) + Number(amount) * (factors[accountId] ?? 1)
  }

  for (const tx of transactions) add(tx.date, tx.account_id, tx.type === 'income' ? tx.amount : -tx.amount)
  for (const t of transfers) {
    add(t.date, t.from_account_id, -t.amount)
    add(t.date, t.to_account_id, t.to_amount)
  }
  for (const loan of loans) {
    if (loan.account_id) add(loan.date, loan.account_id, loan.direction === 'lent' ? -loan.amount : loan.amount)
  }

  const end = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()))
  const start = new Date(end)
  start.setUTCDate(start.getUTCDate() - (days - 1))
  const startKey = toDateKey(start)

  let balance = accounts.reduce((sum, a) => sum + Number(a.initial_amount ?? 0) * (factors[a.id] ?? 1), 0)
  for (const [key, amount] of Object.entries(deltas)) {
    if (key < startKey) balance += amount
  }

  const points: BalancePoint[] = []
  for (const d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    const key = toDateKey(d)
    balance += deltas[key] ?? 0
    points.push({ date: key, balance })
  }

  return points
}
