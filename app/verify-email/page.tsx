'use client'

import { Suspense, useState, useTransition, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { verifyEmailAction } from '../auth/actions'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

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
      }
      else {
        setError(res.error || 'Failed to verify email. Please check your code.')
      }
    })
  }

  return (
    <Card className="w-full max-w-md shadow-xl border-border">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-foreground">Check Your Email</CardTitle>
        <CardDescription className="text-muted-foreground">
          We sent a 6-digit verification code to
          {' '}
          <span className="font-semibold text-foreground">{email || 'your email address'}</span>
          .
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Confirm your Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="bg-zinc-50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="otp">6-Digit Code</Label>
            <Input
              id="otp"
              name="otp"
              type="text"
              required
              maxLength={6}
              pattern="\d{6}"
              className="tracking-[0.25em] font-mono text-center text-xl"
              placeholder="000000"
            />
          </div>

          <Button
            type="submit"
            disabled={isPending}
            className="w-full"
          >
            {isPending ? 'Verifying...' : 'Verify Email & Sign In'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/20 p-4">
      <Suspense fallback={<div className="text-muted-foreground">Loading...</div>}>
        <VerifyEmailForm />
      </Suspense>
    </div>
  )
}
