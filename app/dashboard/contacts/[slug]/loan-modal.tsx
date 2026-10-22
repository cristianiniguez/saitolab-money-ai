'use client'

import { useEffect, useState, useTransition } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { format, parseISO } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import { type Account } from '@/lib/schemas/accounts'
import { type Contact } from '@/lib/schemas/contacts'
import { loanSchema, LOAN_DIRECTIONS, type Loan, type LoanValues } from '@/lib/schemas/loans'
import { toast } from 'sonner'
import { createLoan, updateLoan } from './actions'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
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
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover'
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
  contactId?: string
  contacts?: Contact[]
  loan?: Loan | null
  accounts: Account[]
  onSuccess: () => void
}

export function LoanModal({ open, onOpenChange, contactId, contacts, loan, accounts, onSuccess }: LoanModalProps) {
  const [isPending, startTransition] = useTransition()
  const [serverError, setServerError] = useState<string | null>(null)
  const showContactSelect = contactId === undefined

  const form = useForm<LoanValues>({
    defaultValues: { account_id: null, contact_id: contactId ?? '', date: '', direction: 'lent', amount: 0, description: '' },
    resolver: zodResolver(loanSchema)
  })

  useEffect(() => {
    if (open) {
      form.reset(loan
        ? { account_id: loan.account_id, contact_id: loan.contact_id, date: loan.date, direction: loan.direction, amount: loan.amount, description: loan.description }
        : { account_id: null, contact_id: contactId ?? '', date: '', direction: 'lent', amount: 0, description: '' }
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

          {showContactSelect && (
            <Controller
              name="contact_id"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid || undefined} className="space-y-2">
                  <FieldLabel>Contact</FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="contact_id" className="w-full" aria-invalid={fieldState.invalid}>
                      <SelectValue placeholder="Select a contact" />
                    </SelectTrigger>
                    <SelectContent>
                      {(contacts ?? []).map(contact => (
                        <SelectItem key={contact.id} value={contact.id}>
                          {contact.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldError className="text-xs">{fieldState.error?.message}</FieldError>
                </Field>
              )}
            />
          )}

          <Controller
            name="date"
            control={form.control}
            render={({ field, fieldState }) => {
              const selectedDate = field.value ? parseISO(field.value) : undefined
              return (
                <Field data-invalid={fieldState.invalid || undefined} className="space-y-2">
                  <FieldLabel>Date</FieldLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        aria-invalid={fieldState.invalid}
                        className="w-full justify-start font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                        {selectedDate
                          ? format(selectedDate, 'PPP')
                          : <span className="text-muted-foreground">Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={date => field.onChange(date ? format(date, 'yyyy-MM-dd') : '')}
                      />
                    </PopoverContent>
                  </Popover>
                  <FieldError className="text-xs">{fieldState.error?.message}</FieldError>
                </Field>
              )
            }}
          />

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
