import { getAccessToken, createInsForgeServerClient, getCurrentUser } from '@/lib/insforge/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BalanceChart, type AccountChartSlice } from './components/balance-chart'

const CHART_COLORS = ['--chart-1', '--chart-2', '--chart-3', '--chart-4', '--chart-5'] as const

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

export default async function DashboardPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/sign-in')

  const token = await getAccessToken()
  const insforge = createInsForgeServerClient(token!)

  const [{ data: transactions }, { data: accounts }] = await Promise.all([
    insforge.database
      .from('transactions')
      .select('amount, type, account_id')
      .eq('user_id', user.id),
    insforge.database
      .from('accounts')
      .select('id, name')
      .eq('user_id', user.id)
  ])

  const txList = (transactions ?? []) as { amount: number, type: string, account_id: string }[]
  const acctList = (accounts ?? []) as { id: string, name: string }[]

  let totalIncome = 0
  let totalExpenses = 0
  const perAccount: Record<string, { income: number, expenses: number }> = {}

  for (const tx of txList) {
    const bucket = (perAccount[tx.account_id] ??= { income: 0, expenses: 0 })
    if (tx.type === 'income') {
      totalIncome += tx.amount
      bucket.income += tx.amount
    } else {
      totalExpenses += tx.amount
      bucket.expenses += tx.amount
    }
  }

  const totalBalance = totalIncome - totalExpenses

  const chartSlices: AccountChartSlice[] = acctList.map((acct, i) => {
    const { income = 0, expenses = 0 } = perAccount[acct.id] ?? {}
    return {
      accountId: acct.id,
      name: acct.name,
      income,
      expenses,
      netBalance: income - expenses,
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

      <div className="grid auto-rows-min gap-4 md:grid-cols-2">
        <BalanceChart slices={chartSlices} />
      </div>
    </div>
  )
}
