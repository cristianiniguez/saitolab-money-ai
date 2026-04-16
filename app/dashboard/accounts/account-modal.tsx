'use client'

import { useEffect, useState, useTransition } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { accountSchema, ACCOUNT_TYPES, type Account, type AccountValues } from '@/lib/schemas/accounts'
import { slugify } from '@/lib/utils/slugify'
import { createAccount, updateAccount } from './actions'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Field, FieldLabel, FieldError } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'

interface AccountModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  account?: Account | null
  onSuccess: () => void
}

const ACCOUNT_TYPE_LABELS: Record<typeof ACCOUNT_TYPES[number], string> = {
  bank: 'Bank',
  crypto: 'Crypto',
  wallet: 'Wallet'
}

export function AccountModal({ open, onOpenChange, account, onSuccess }: AccountModalProps) {
  const [isPending, startTransition] = useTransition()
  const [serverError, setServerError] = useState<string | null>(null)

  const form = useForm<AccountValues>({
    defaultValues: { name: '', type: 'bank', slug: '' },
    resolver: zodResolver(accountSchema)
  })

  const nameValue = form.watch('name')

  useEffect(() => {
    form.setValue('slug', slugify(nameValue))
  }, [nameValue, form])

  useEffect(() => {
    if (open) {
      form.reset(account ? { name: account.name, type: account.type, slug: account.slug } : { name: '', type: 'bank', slug: '' })
      setServerError(null)
    }
  }, [open, account, form])

  const onSubmit = (data: AccountValues) => {
    setServerError(null)
    startTransition(async () => {
      const res = account
        ? await updateAccount(account.id, data)
        : await createAccount(data)
      if (res.success) {
        onOpenChange(false)
        onSuccess()
      }
      else {
        setServerError(res.error ?? 'Something went wrong')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{account ? 'Edit Account' : 'New Account'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-2">
          {serverError && (
            <Alert variant="destructive">
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          )}

          <Controller
            name="name"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined} className="space-y-2">
                <FieldLabel>Account Name</FieldLabel>
                <Input
                  {...field}
                  id="name"
                  type="text"
                  placeholder="e.g. Chase Checking"
                  aria-invalid={fieldState.invalid}
                />
                <FieldError className="text-xs">{fieldState.error?.message}</FieldError>
              </Field>
            )}
          />

          <Controller
            name="slug"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined} className="space-y-2">
                <FieldLabel>Slug</FieldLabel>
                <Input
                  {...field}
                  id="slug"
                  type="text"
                  readOnly
                  className="bg-muted text-muted-foreground cursor-not-allowed"
                  aria-invalid={fieldState.invalid}
                />
                <FieldError className="text-xs">{fieldState.error?.message}</FieldError>
              </Field>
            )}
          />

          <Controller
            name="type"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined} className="space-y-2">
                <FieldLabel>Account Type</FieldLabel>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger
                    id="type"
                    className="w-full"
                    aria-invalid={fieldState.invalid}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ACCOUNT_TYPES.map(type => (
                      <SelectItem key={type} value={type}>
                        {ACCOUNT_TYPE_LABELS[type]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError className="text-xs">{fieldState.error?.message}</FieldError>
              </Field>
            )}
          />

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving...' : account ? 'Save' : 'Create Account'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
