import { getCurrentUser } from '@/lib/insforge/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function DashboardPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/sign-in')

  return (
    <div className="flex flex-col flex-1 items-center bg-muted/20 font-sans p-8">
      <main className="flex flex-1 w-full max-w-4xl flex-col items-center py-16 px-8 bg-card text-card-foreground shadow-sm border border-border rounded-3xl mt-8">
        <div className="flex flex-col items-center text-center max-w-2xl w-full">
          <h1 className="text-4xl font-bold tracking-tight text-foreground mb-4">
            Welcome back!
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            Manage your incomes and expenses effortlessly. Your balance is up to date.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
            <Card className="bg-primary/5 border-primary/20 shadow-sm text-left">
              <CardHeader className="pb-2">
                <CardTitle className="text-primary text-sm font-semibold tracking-wide uppercase">Total Incomes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">$0.00</div>
              </CardContent>
            </Card>
            <Card className="bg-destructive/5 border-destructive/20 shadow-sm text-left">
              <CardHeader className="pb-2">
                <CardTitle className="text-destructive text-sm font-semibold tracking-wide uppercase">Total Expenses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">$0.00</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
