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
