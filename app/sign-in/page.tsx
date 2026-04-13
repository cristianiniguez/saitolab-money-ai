'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signInAction } from '../auth/actions'

export default function SignInPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string

    startTransition(async () => {
      const res = await signInAction(formData)
      if (res.success) {
        router.push('/')
      } else {
        if (res.requireVerification) {
          router.push(`/verify-email?email=${encodeURIComponent(email)}`)
        } else {
          setError(res.error || 'Failed to sign in')
        }
      }
    })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-zinc-100">
        <h1 className="text-2xl font-bold text-center text-zinc-900 mb-2">Welcome Back</h1>
        <p className="text-sm text-center text-zinc-500 mb-8">Sign in to SaitoLab Money</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-100">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1" htmlFor="email">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="w-full px-4 py-2 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="w-full px-4 py-2 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-blue-600 text-white font-semibold py-2.5 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-all disabled:opacity-50"
          >
            {isPending ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-zinc-600">
          Don&apos;t have an account?{' '}
          <Link href="/sign-up" className="text-blue-600 hover:text-blue-700 font-medium hover:underline">
            Sign up
          </Link>
        </div>
      </div>
    </div>
  )
}
