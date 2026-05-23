'use client'

import { useState, useTransition } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { userSettingsSchema, type UserSettings, type UserSettingsValues } from '@/lib/schemas/settings'
import { type Currency } from '@/lib/schemas/currencies'
import { upsertUserSettings } from './actions'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field, FieldLabel, FieldError } from '@/components/ui/field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'

interface SettingsClientProps {
  settings: UserSettings | null
  currencies: Currency[]
}

export function SettingsClient({ settings, currencies }: SettingsClientProps) {
  const fallbackCurrencyId = currencies.find(c => c.slug === 'usd')?.id ?? currencies[0]?.id ?? ''
  const [isPending, startTransition] = useTransition()
  const [serverError, setServerError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const form = useForm<UserSettingsValues>({
    defaultValues: { main_currency_id: settings?.main_currency_id ?? fallbackCurrencyId },
    resolver: zodResolver(userSettingsSchema)
  })

  const onSubmit = (data: UserSettingsValues) => {
    setServerError(null)
    setSaved(false)
    startTransition(async () => {
      const res = await upsertUserSettings(data)
      if (res.success) setSaved(true)
      else setServerError(res.error ?? 'Something went wrong')
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your personal preferences.</p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {serverError && (
          <Alert variant="destructive">
            <AlertDescription>{serverError}</AlertDescription>
          </Alert>
        )}
        {saved && (
          <Alert>
            <AlertDescription>Settings saved.</AlertDescription>
          </Alert>
        )}

        <Controller
          name="main_currency_id"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid || undefined} className="space-y-2">
              <FieldLabel>Main Currency</FieldLabel>
              <p className="text-xs text-muted-foreground">
                Used as the default when creating new accounts and for dashboard totals.
              </p>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-full max-w-sm" aria-invalid={fieldState.invalid}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.symbol} — {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError className="text-xs">{fieldState.error?.message}</FieldError>
            </Field>
          )}
        />

        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving...' : 'Save Settings'}
        </Button>
      </form>
    </div>
  )
}
