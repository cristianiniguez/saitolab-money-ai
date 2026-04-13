import Link from 'next/link'
import { getCurrentUser } from '@/lib/insforge/server'
import { signOutAction } from '@/app/auth/actions'
import { Button, buttonVariants } from '@/components/ui/button'
import { ModeToggle } from '@/components/theme-toggle'

export default async function Header() {
  const user = await getCurrentUser()

  return (
    <header className="bg-background border-b border-border py-3 px-6 flex items-center justify-between sticky top-0 z-50">
      <Link href="/" className="font-bold text-lg text-primary tracking-tight">
        SaitoLab Money
      </Link>
      <div className="flex items-center gap-4 text-sm font-medium">
        <ModeToggle />
        {user ? (
          <>
            <span className="text-muted-foreground hidden sm:inline-block">{user.email}</span>
            <form action={signOutAction}>
              <Button
                type="submit"
                variant="ghost"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                Sign Out
              </Button>
            </form>
          </>
        ) : (
          <>
            <Link 
              href="/sign-in" 
              className={buttonVariants({ variant: "ghost", className: "text-muted-foreground hover:text-foreground" })}
            >
              Sign In
            </Link>
            <Link 
              href="/sign-up" 
              className={buttonVariants({ className: "shadow-sm" })}
            >
              Sign Up
            </Link>
          </>
        )}
      </div>
    </header>
  )
}
