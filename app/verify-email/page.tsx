'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { verifyEmailAction } from '../auth/actions'
import { Suspense } from 'react'

function VerifyEmailForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  
  const initialEmail = searchParams.get('email') || ''
  const [email, setEmail] = useState(initialEmail)

  useEffect(() => {
    if (!initialEmail) {
      // Small heads up if user reaches here without an email param.
    }
  }, [initialEmail])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    
    startTransition(async () => {
      const res = await verifyEmailAction(formData)
      if (res.success) {
        router.push('/')
      } else {
        setError(res.error || 'Failed to verify email. Please check your code.')
      }
    })
  }

  return (
    <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-zinc-100">
      <h1 className="text-2xl font-bold text-center text-zinc-900 mb-2">Check Your Email</h1>
      <p className="text-sm text-center text-zinc-500 mb-8">
        We sent a 6-digit verification code to <span className="font-semibold text-zinc-700">{email || 'your email address'}</span>.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-100">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1" htmlFor="email">
            Confirm your Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors bg-zinc-50"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1" htmlFor="otp">
            6-Digit Code
          </label>
          <input
            id="otp"
            name="otp"
            type="text"
            required
            maxLength={6}
            pattern="\d{6}"
            className="w-full px-4 py-2 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors tracking-[0.25em] font-mono text-center text-xl"
            placeholder="000000"
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-blue-600 text-white font-semibold py-2.5 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-all disabled:opacity-50"
        >
          {isPending ? 'Verifying...' : 'Verify Email & Sign In'}
        </button>
      </form>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-4">
      <Suspense fallback={<div className="text-zinc-500">Loading...</div>}>
        <VerifyEmailForm />
      </Suspense>
    </div>
  )
}
