'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { exchangeOAuthCodeAction } from '../actions'

function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const code = searchParams.get('insforge_code')
    const errorParam = searchParams.get('error')

    if (errorParam) {
      setError('Google sign-in was cancelled or failed. Please try again.')
      return
    }

    if (!code) {
      router.push('/sign-in')
      return
    }

    const codeVerifier = sessionStorage.getItem('insforge_pkce_verifier') ?? ''

    exchangeOAuthCodeAction(code, codeVerifier).then(result => {
      if (result.success) {
        router.push('/dashboard')
      } else {
        setError(result.error || 'Authentication failed. Please try again.')
      }
    })
  }, [searchParams, router])

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-muted/20 p-4">
        <p className="text-destructive text-sm">{error}</p>
        <Link href="/sign-in" className="text-blue-600 hover:text-blue-700 text-sm font-medium hover:underline">
          Back to sign in
        </Link>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/20 p-4">
      <p className="text-muted-foreground text-sm">Signing you in…</p>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-muted/20 p-4">
        <p className="text-muted-foreground text-sm">Loading…</p>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  )
}
