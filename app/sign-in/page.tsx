'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Field } from '@base-ui/react/field'
import { signInAction } from '../auth/actions'
import { signInSchema, type SignInValues } from '@/lib/schemas/auth'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function SignInPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [serverError, setServerError] = useState<string | null>(null)

  const form = useForm<SignInValues>({
    defaultValues: { email: '', password: '' },
    resolver: zodResolver(signInSchema)
  })

  const onSubmit = (data: SignInValues) => {
    setServerError(null)
    startTransition(async () => {
      const res = await signInAction(data)
      if (res.success) {
        router.push('/')
      }
      else {
        if (res.requireVerification) {
          router.push(`/verify-email?email=${encodeURIComponent(data.email)}`)
        }
        else {
          setServerError(res.error || 'Failed to sign in')
        }
      }
    })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/20 p-4">
      <Card className="w-full max-w-md shadow-xl border-border">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-foreground">Welcome Back</CardTitle>
          <CardDescription className="text-muted-foreground">Sign in to SaitoLab Money</CardDescription>
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
                <Field.Root invalid={fieldState.invalid} className="space-y-2">
                  <Field.Label render={<Label />}>Email Address</Field.Label>
                  <Input
                    {...field}
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.error && (
                    <Field.Error match={true} className="text-xs text-destructive">
                      {fieldState.error.message}
                    </Field.Error>
                  )}
                </Field.Root>
              )}
            />

            <Controller
              name="password"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field.Root invalid={fieldState.invalid} className="space-y-2">
                  <Field.Label render={<Label />}>Password</Field.Label>
                  <Input
                    {...field}
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="••••••••"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.error && (
                    <Field.Error match={true} className="text-xs text-destructive">
                      {fieldState.error.message}
                    </Field.Error>
                  )}
                </Field.Root>
              )}
            />

            <Button
              type="submit"
              disabled={isPending}
              className="w-full"
            >
              {isPending ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-8 text-center text-sm text-zinc-600">
            Don&apos;t have an account?
            {' '}
            <Link href="/sign-up" className="text-blue-600 hover:text-blue-700 font-medium hover:underline">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
