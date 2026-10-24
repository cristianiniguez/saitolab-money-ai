'use client'

import { useState } from 'react'
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts'
import { TrendingDown, TrendingUp } from 'lucide-react'
import { ChartContainer, ChartTooltip, type ChartConfig } from '@/components/ui/chart'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { type BalancePoint } from '@/lib/balances'

const RANGES = [
  { value: '7', label: '7 days', days: 7 },
  { value: '30', label: '30 days', days: 30 },
  { value: '90', label: '90 days', days: 90 },
  { value: '365', label: '12 months', days: 365 }
] as const

const chartConfig = {
  balance: { label: 'Balance', color: 'var(--primary)' }
} satisfies ChartConfig

const compactFmt = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 })

// Parse YYYY-MM-DD as a UTC date so labels don't shift with the viewer's timezone.
const parseDate = (key: string) => new Date(`${key}T00:00:00Z`)

const shortDateFmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
const longDateFmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })

export function BalanceHistoryChart({ history, currencyCode }: { history: BalancePoint[], currencyCode: string }) {
  const [range, setRange] = useState<string>('30')

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: currencyCode }).format(n)

  const days = RANGES.find(r => r.value === range)?.days ?? 30
  const data = history.slice(-days)
  const current = data.at(-1)?.balance ?? 0
  const change = current - (data[0]?.balance ?? 0)
  const TrendIcon = change < 0 ? TrendingDown : TrendingUp

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Balance history</h2>
          <p className="text-sm text-muted-foreground">Total net worth over time</p>
        </div>
        <Tabs value={range} onValueChange={setRange}>
          <TabsList>
            {RANGES.map(r => (
              <TabsTrigger key={r.value} value={r.value}>{r.label}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <Card className="rounded-xl bg-muted/50 border-0 shadow-none">
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Current balance</p>
              <p className={`text-3xl font-bold ${current < 0 ? 'text-destructive' : 'text-foreground'}`}>
                {fmt(current)}
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-sm">
              <TrendIcon className={`size-4 ${change < 0 ? 'text-destructive' : 'text-primary'}`} />
              <span className={`font-semibold ${change < 0 ? 'text-destructive' : 'text-primary'}`}>
                {change >= 0 ? '+' : ''}{fmt(change)}
              </span>
              <span className="text-muted-foreground">in period</span>
            </div>
          </div>

          <ChartContainer config={chartConfig} className="h-[280px] w-full aspect-auto">
            <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} strokeDasharray="4 4" />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={24}
                tickFormatter={(key: string) => shortDateFmt.format(parseDate(key))}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                width={48}
                tickFormatter={(n: number) => compactFmt.format(n)}
              />
              <ChartTooltip
                cursor={{ strokeDasharray: '4 4' }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const point = payload[0].payload as BalancePoint
                  return (
                    <div className="rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl">
                      <p className="font-medium mb-0.5">{longDateFmt.format(parseDate(point.date))}</p>
                      <p className="text-muted-foreground">{fmt(point.balance)}</p>
                    </div>
                  )
                }}
              />
              <Line
                dataKey="balance"
                type="monotone"
                stroke="var(--color-balance)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
