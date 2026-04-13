import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'

export default function HomePage() {
  return (
    <div className="flex flex-col flex-1 items-center bg-muted/20 font-sans p-8">
      <main className="flex flex-1 w-full max-w-4xl flex-col items-center py-16 px-8 bg-card text-card-foreground shadow-sm border border-border rounded-3xl mt-8">
        <div className="flex flex-col items-center text-center max-w-2xl">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground mb-6">
            Take Control of Your
            {' '}
            <span className="text-primary">Money</span>
          </h1>
          <p className="text-lg leading-8 text-muted-foreground mb-10">
            SaitoLab Money is the simplest way to track your incomes and expenses.
            Get a clear picture of your financial health — all in one place.
          </p>

          <div className="flex gap-4 mb-16">
            <Link href="/sign-up" className={buttonVariants({ size: 'lg' })}>Get Started</Link>
            <Link href="/sign-in" className={buttonVariants({ size: 'lg', variant: 'outline' })}>Sign In</Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full text-left">
            <div className="rounded-2xl border border-border bg-muted/40 p-6">
              <div className="text-2xl mb-3">📥</div>
              <h2 className="font-semibold text-foreground mb-1">Track Incomes</h2>
              <p className="text-sm text-muted-foreground">Log every source of income and see where your money comes from.</p>
            </div>
            <div className="rounded-2xl border border-border bg-muted/40 p-6">
              <div className="text-2xl mb-3">📤</div>
              <h2 className="font-semibold text-foreground mb-1">Track Expenses</h2>
              <p className="text-sm text-muted-foreground">Record your spending and identify where you can save more.</p>
            </div>
            <div className="rounded-2xl border border-border bg-muted/40 p-6">
              <div className="text-2xl mb-3">📊</div>
              <h2 className="font-semibold text-foreground mb-1">Stay Informed</h2>
              <p className="text-sm text-muted-foreground">Get a real-time overview of your balance and financial trends.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
