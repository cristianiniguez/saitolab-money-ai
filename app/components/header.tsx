import Link from 'next/link'
import { getCurrentUser } from '@/lib/insforge/server'
import { signOutAction } from '@/app/auth/actions'

export default async function Header() {
  const user = await getCurrentUser()

  return (
    <header className="bg-white border-b border-zinc-200 py-3 px-6 flex items-center justify-between sticky top-0 z-50">
      <Link href="/" className="font-bold text-lg text-blue-600 tracking-tight">
        SaitoLab Money
      </Link>
      <div className="flex items-center gap-4 text-sm font-medium">
        {user ? (
          <>
            <span className="text-zinc-500 hidden sm:inline-block">{user.email}</span>
            <form action={signOutAction}>
              <button
                type="submit"
                className="text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-md transition-colors"
              >
                Sign Out
              </button>
            </form>
          </>
        ) : (
          <>
            <Link
              href="/sign-in"
              className="text-zinc-600 hover:text-zinc-900 px-3 py-1.5 rounded-md transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="bg-blue-600 text-white px-4 py-1.5 rounded-md hover:bg-blue-700 transition-colors shadow-sm"
            >
              Sign Up
            </Link>
          </>
        )}
      </div>
    </header>
  )
}
