import { getAccessToken, createInsForgeServerClient, getCurrentUser } from '@/lib/insforge/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { computeAccountBalances, computeBalanceHistory } from '@/lib/balances'
import { convertCurrency } from '@/lib/utils/currency'
import { BalanceChart, type AccountChartSlice } from './components/balance-chart'
import { BalanceHistoryChart } from './components/balance-history-chart'

const CHART_COLORS = ['--chart-1', '--chart-2', '--chart-3', '--chart-4', '--chart-5'] as const

export default async function DashboardPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/sign-in')

  const token = await getAccessToken()
  const insforge = createInsForgeServerClient(token!)

  const [{ data: transactions }, { data: transfers }, { data: loans }, { data: accounts }, { data: userSettings }] = await Promise.all([
    insforge.database
      .from('transactions')
      .select('amount, type, account_id, date')
      .eq('user_id', user.id),
    insforge.database
      .from('transfers')
      .select('amount, to_amount, from_account_id, to_account_id, date')
      .eq('user_id', user.id),
    insforge.database
      .from('loans')
      .select('amount, direction, account_id, date')
      .eq('user_id', user.id),
    insforge.database
      .from('accounts')
      .select('id, name, initial_amount, currencies(rate_usd)')
      .eq('user_id', user.id),
    insforge.database
      .from('user_settings')
      .select('currencies(symbol, slug, type, rate_usd)')
      .eq('user_id', user.id)
      .limit(1)
  ])

  const currencyRow = (userSettings as { currencies: { symbol: string, slug: string, type: string, rate_usd: number } | null }[] | null)?.[0]?.currencies
  const isFiat = currencyRow?.type === 'fiat'
  const currencyCode = isFiat ? currencyRow.slug.toUpperCase() : 'USD'
  // rate_usd = units of a currency per 1 USD; non-fiat preferences fall back to USD (rate 1).
  const targetRate = isFiat ? Number(currencyRow.rate_usd) : 1

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: currencyCode }).format(n)

  const txList = (transactions ?? []) as { amount: number, type: string, account_id: string, date: string }[]
  type AccountRow = { id: string, name: string, initial_amount: number, currencies: { rate_usd: number } | null }
  const acctList = (accounts ?? []) as unknown as AccountRow[]

  // Multiplier converting each account's currency into the user's currency.
  const factors: Record<string, number> = Object.fromEntries(
    acctList.map(acct => {
      const rate = Number(acct.currencies?.rate_usd)
      return [acct.id, rate > 0 ? convertCurrency(1, rate, targetRate) : 1]
    })
  )
  const convert = (accountId: string, amount: number) => Number(amount) * (factors[accountId] ?? 1)

  // Loans are recorded in the user's main currency, so express them in each account's currency
  // before the per-account math; `convert` then maps them back to the display currency.
  const mainRate = Number(currencyRow?.rate_usd)
  const loanFactor = mainRate > 0 ? convertCurrency(1, mainRate, targetRate) : 1
  const loanList = ((loans ?? []) as { amount: number, direction: string, account_id: string | null, date: string }[])
    .map(loan => ({
      ...loan,
      amount: loan.account_id ? Number(loan.amount) * loanFactor / (factors[loan.account_id] ?? 1) : Number(loan.amount)
    }))

  const balances = computeAccountBalances(acctList, txList, transfers ?? [], loanList)
  const balanceHistory = computeBalanceHistory(acctList, txList, transfers ?? [], loanList, 365, factors)

  let totalIncome = 0
  let totalExpenses = 0
  const perAccount: Record<string, { income: number, expenses: number }> = {}

  for (const tx of txList) {
    const bucket = (perAccount[tx.account_id] ??= { income: 0, expenses: 0 })
    const amount = convert(tx.account_id, tx.amount)
    if (tx.type === 'income') {
      totalIncome += amount
      bucket.income += amount
    } else {
      totalExpenses += amount
      bucket.expenses += amount
    }
  }

  const totalBalance = acctList.reduce((sum, acct) => sum + convert(acct.id, balances[acct.id] ?? 0), 0)

  const chartSlices: AccountChartSlice[] = acctList.map((acct, i) => {
    const { income = 0, expenses = 0 } = perAccount[acct.id] ?? {}
    return {
      accountId: acct.id,
      name: acct.name,
      income,
      expenses,
      netBalance: convert(acct.id, balances[acct.id] ?? 0),
      fill: `var(${CHART_COLORS[i % 5]})`
    }
  })

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Your financial overview at a glance.</p>
      </div>

      <div className="grid auto-rows-min gap-4 md:grid-cols-3">
        <Card className="rounded-xl bg-muted/50 border-0 shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${totalBalance < 0 ? 'text-destructive' : 'text-foreground'}`}>
              {fmt(totalBalance)}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl bg-muted/50 border-0 shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Incomes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{fmt(totalIncome)}</div>
          </CardContent>
        </Card>

        <Card className="rounded-xl bg-muted/50 border-0 shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{fmt(totalExpenses)}</div>
          </CardContent>
        </Card>
      </div>

      <BalanceHistoryChart history={balanceHistory} currencyCode={currencyCode} />

      <div className="grid auto-rows-min gap-4 md:grid-cols-2">
        <BalanceChart slices={chartSlices} currencyCode={currencyCode} />
      </div>
    </div>
  )
}
