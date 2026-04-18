'use client'

import { PieChart, Pie, Cell, Tooltip } from 'recharts'
import { ChartContainer } from '@/components/ui/chart'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export interface AccountChartSlice {
  accountId: string
  name: string
  netBalance: number
  income: number
  expenses: number
  fill: string
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

export function BalanceChart({ slices }: { slices: AccountChartSlice[] }) {
  const positiveSlices = slices.filter(s => s.netBalance > 0)

  const chartConfig = Object.fromEntries(
    slices.map(s => [s.accountId, { label: s.name, color: s.fill }])
  )

  if (slices.length === 0) {
    return (
      <Card className="w-full text-left rounded-xl bg-muted/50 border-0 shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Balance by Account
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
            Add accounts and transactions to see your balance breakdown.
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderChart = () => {
    if (positiveSlices.length === 0) {
      return (
        <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
          No accounts with a positive balance yet.
        </div>
      )
    }

    return (
      <ChartContainer config={chartConfig} className="h-[240px] w-full aspect-auto">
        <PieChart>
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null
              const slice = payload[0].payload as AccountChartSlice
              return (
                <div className="rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl">
                  <p className="font-medium mb-0.5">{slice.name}</p>
                  <p className="text-muted-foreground">{fmt(slice.netBalance)}</p>
                </div>
              )
            }}
          />
          <Pie
            data={positiveSlices}
            dataKey="netBalance"
            nameKey="name"
            innerRadius={60}
            outerRadius={100}
            strokeWidth={2}
          >
            {positiveSlices.map(slice => (
              <Cell key={slice.accountId} fill={slice.fill} />
            ))}
          </Pie>
        </PieChart>
      </ChartContainer>
    )
  }

  return (
    <Card className="w-full text-left rounded-xl bg-muted/50 border-0 shadow-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Balance by Account
        </CardTitle>
      </CardHeader>
      <CardContent>
        {renderChart()}

        <div className="mt-4 space-y-2 border-t border-border pt-4">
          {slices.map(slice => (
            <div key={slice.accountId} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: slice.fill }}
                />
                <span className="text-foreground">{slice.name}</span>
              </div>
              <span className={slice.netBalance < 0 ? 'text-destructive font-medium' : 'text-foreground font-medium'}>
                {fmt(slice.netBalance)}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
