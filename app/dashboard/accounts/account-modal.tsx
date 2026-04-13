'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Field } from '@base-ui/react/field'
import { accountSchema, ACCOUNT_TYPES, type Account, type AccountValues } from '@/lib/schemas/accounts'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
}

const ACCOUNT_TYPE_LABELS: Record<typeof ACCOUNT_TYPES[number], string> = {
  bank: 'Bank',
  crypto: 'Crypto',
  wallet: 'Wallet'
}

export function AccountModal({ open, onOpenChange, account }: AccountModalProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [serverError, setServerError] = useState<string | null>(null)

  const form = useForm<AccountValues>({
    defaultValues: { name: '', type: 'bank' },
    resolver: zodResolver(accountSchema)
  })

  useEffect(() => {
    if (open) {
      form.reset(account ? { name: account.name, type: account.type } : { name: '', type: 'bank' })
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
        router.refresh()
        onOpenChange(false)
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
              <Field.Root invalid={fieldState.invalid} className="space-y-2">
                <Field.Label render={<Label />}>Account Name</Field.Label>
                <Input
                  {...field}
                  id="name"
                  type="text"
                  placeholder="e.g. Chase Checking"
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
            name="type"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field.Root invalid={fieldState.invalid} className="space-y-2">
                <Field.Label render={<Label />}>Account Type</Field.Label>
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
                {fieldState.error && (
                  <Field.Error match={true} className="text-xs text-destructive">
                    {fieldState.error.message}
                  </Field.Error>
                )}
              </Field.Root>
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
