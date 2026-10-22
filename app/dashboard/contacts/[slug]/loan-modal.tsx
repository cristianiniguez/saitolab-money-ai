'use client'

import { useEffect, useState, useTransition } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { type Account } from '@/lib/schemas/accounts'
import { loanSchema, LOAN_DIRECTIONS, type Loan, type LoanValues } from '@/lib/schemas/loans'
import { toast } from 'sonner'
import { createLoan, updateLoan } from './actions'
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

const DIRECTION_LABELS: Record<typeof LOAN_DIRECTIONS[number], string> = {
  lent: 'Lent (they owe you)',
  borrowed: 'Borrowed (you owe them)'
}

const NO_ACCOUNT = 'none'

interface LoanModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  contactId: string
  loan?: Loan | null
  accounts: Account[]
  onSuccess: () => void
}

export function LoanModal({ open, onOpenChange, contactId, loan, accounts, onSuccess }: LoanModalProps) {
  const [isPending, startTransition] = useTransition()
  const [serverError, setServerError] = useState<string | null>(null)

  const form = useForm<LoanValues>({
    defaultValues: { account_id: null, contact_id: contactId, direction: 'lent', amount: 0, description: '' },
    resolver: zodResolver(loanSchema)
  })

  useEffect(() => {
    if (open) {
      form.reset(loan
        ? { account_id: loan.account_id, contact_id: contactId, direction: loan.direction, amount: loan.amount, description: loan.description }
        : { account_id: null, contact_id: contactId, direction: 'lent', amount: 0, description: '' }
      )
      setServerError(null)
    }
  }, [open, loan, contactId, form])

  const onSubmit = (data: LoanValues) => {
    setServerError(null)
    startTransition(async () => {
      const res = loan
        ? await updateLoan(loan.id, data)
        : await createLoan(data)
      if (res.success) {
        toast.success(loan ? 'Loan updated' : 'Loan created')
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
          <DialogTitle>{loan ? 'Edit Loan' : 'New Loan'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-2">
          {serverError && (
            <Alert variant="destructive">
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          )}

          <Controller
            name="direction"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined} className="space-y-2">
                <FieldLabel>Direction</FieldLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="direction" className="w-full" aria-invalid={fieldState.invalid}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LOAN_DIRECTIONS.map(direction => (
                      <SelectItem key={direction} value={direction}>
                        {DIRECTION_LABELS[direction]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError className="text-xs">{fieldState.error?.message}</FieldError>
              </Field>
            )}
          />

          <Controller
            name="amount"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined} className="space-y-2">
                <FieldLabel>Amount</FieldLabel>
                <Input
                  {...field}
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  aria-invalid={fieldState.invalid}
                />
                <FieldError className="text-xs">{fieldState.error?.message}</FieldError>
              </Field>
            )}
          />

          <Controller
            name="account_id"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined} className="space-y-2">
                <FieldLabel>Account (optional)</FieldLabel>
                <Select
                  value={field.value ?? NO_ACCOUNT}
                  onValueChange={value => field.onChange(value === NO_ACCOUNT ? null : value)}
                >
                  <SelectTrigger id="account_id" className="w-full" aria-invalid={fieldState.invalid}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_ACCOUNT}>No account</SelectItem>
                    {accounts.map(account => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError className="text-xs">{fieldState.error?.message}</FieldError>
              </Field>
            )}
          />

          <Controller
            name="description"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined} className="space-y-2">
                <FieldLabel>Description</FieldLabel>
                <Input
                  {...field}
                  id="description"
                  type="text"
                  placeholder="e.g. Dinner, rent split..."
                  aria-invalid={fieldState.invalid}
                />
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
              {isPending ? 'Saving...' : loan ? 'Save' : 'Create Loan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
