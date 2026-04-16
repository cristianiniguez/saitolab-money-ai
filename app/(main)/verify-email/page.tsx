'use client'

import { Suspense, useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { verifyEmailAction } from '../auth/actions'
import { verifyEmailSchema, type VerifyEmailValues } from '@/lib/schemas/auth'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldLabel, FieldError } from '@/components/ui/field'
import { Input } from '@/components/ui/input'

function VerifyEmailForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [serverError, setServerError] = useState<string | null>(null)

  const form = useForm<VerifyEmailValues>({
    defaultValues: { email: searchParams.get('email') ?? '', otp: '' },
    resolver: zodResolver(verifyEmailSchema)
  })

  const email = form.watch('email')

  const onSubmit = (data: VerifyEmailValues) => {
    setServerError(null)
    startTransition(async () => {
      const res = await verifyEmailAction(data)
      if (res.success) {
        router.push('/dashboard')
      }
      else {
        setServerError(res.error || 'Failed to verify email. Please check your code.')
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
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          {serverError && (
            <Alert variant="destructive">
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          )}

          <Controller
            name="email"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined} className="space-y-2">
                <FieldLabel>Confirm your Email</FieldLabel>
                <Input
                  {...field}
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  aria-invalid={fieldState.invalid}
                  className="bg-zinc-50"
                />
                <FieldError className="text-xs">{fieldState.error?.message}</FieldError>
              </Field>
            )}
          />

          <Controller
            name="otp"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined} className="space-y-2">
                <FieldLabel>6-Digit Code</FieldLabel>
                <Input
                  {...field}
                  id="otp"
                  type="text"
                  maxLength={6}
                  placeholder="000000"
                  aria-invalid={fieldState.invalid}
                  className="tracking-[0.25em] font-mono text-center text-xl"
                />
                <FieldError className="text-xs">{fieldState.error?.message}</FieldError>
              </Field>
            )}
          />

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
