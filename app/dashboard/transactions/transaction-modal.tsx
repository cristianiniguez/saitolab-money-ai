'use client'

import { useEffect, useState, useTransition } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { format, parseISO } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import { Field, FieldLabel, FieldError } from '@/components/ui/field'
import {
  transactionSchema,
  TRANSACTION_TYPES,
  type Transaction,
  type TransactionValues
} from '@/lib/schemas/transactions'
import { type Account } from '@/lib/schemas/accounts'
import { type Category } from '@/lib/schemas/categories'
import { createTransaction, updateTransaction } from './actions'
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

interface TransactionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  transaction?: Transaction | null
  accounts: Account[]
  categories: Category[]
  onSuccess: () => void
}

const TRANSACTION_TYPE_LABELS: Record<typeof TRANSACTION_TYPES[number], string> = {
  income: 'Income',
  expense: 'Expense'
}

const NONE_CATEGORY_VALUE = '__none__'

export function TransactionModal({
  open,
  onOpenChange,
  transaction,
  accounts,
  categories,
  onSuccess
}: TransactionModalProps) {
  const [isPending, startTransition] = useTransition()
  const [serverError, setServerError] = useState<string | null>(null)

  const form = useForm<TransactionValues>({
    defaultValues: {
      name: '',
      date: '',
      amount: undefined,
      type: 'expense',
      account_id: '',
      category_id: undefined
    },
    resolver: zodResolver(transactionSchema)
  })

  useEffect(() => {
    if (open) {
      form.reset(
        transaction
          ? {
              name: transaction.name,
              date: transaction.date,
              amount: transaction.amount,
              type: transaction.type,
              account_id: transaction.account_id,
              category_id: transaction.category_id ?? undefined
            }
          : {
              name: '',
              date: '',
              amount: undefined,
              type: 'expense',
              account_id: '',
              category_id: undefined
            }
      )
      setServerError(null)
    }
  }, [open, transaction, form])

  const onSubmit = (data: TransactionValues) => {
    setServerError(null)
    startTransition(async () => {
      const res = transaction
        ? await updateTransaction(transaction.id, data)
        : await createTransaction(data)
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
          <DialogTitle>{transaction ? 'Edit Transaction' : 'New Transaction'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-2">
          {serverError && (
            <Alert variant="destructive">
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          )}

          {/* Name */}
          <Controller
            name="name"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined} className="space-y-2">
                <FieldLabel>Name</FieldLabel>
                <Input
                  {...field}
                  type="text"
                  placeholder="e.g. Monthly salary"
                  aria-invalid={fieldState.invalid}
                />
                <FieldError className="text-xs">{fieldState.error?.message}</FieldError>
              </Field>
            )}
          />

          {/* Date */}
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

          {/* Amount */}
          <Controller
            name="amount"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined} className="space-y-2">
                <FieldLabel>Amount</FieldLabel>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  aria-invalid={fieldState.invalid}
                  value={field.value ?? ''}
                  onChange={e => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))}
                  onBlur={field.onBlur}
                  name={field.name}
                />
                <FieldError className="text-xs">{fieldState.error?.message}</FieldError>
              </Field>
            )}
          />

          {/* Type */}
          <Controller
            name="type"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined} className="space-y-2">
                <FieldLabel>Type</FieldLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full" aria-invalid={fieldState.invalid}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TRANSACTION_TYPES.map(type => (
                      <SelectItem key={type} value={type}>
                        {TRANSACTION_TYPE_LABELS[type]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError className="text-xs">{fieldState.error?.message}</FieldError>
              </Field>
            )}
          />

          {/* Account */}
          <Controller
            name="account_id"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined} className="space-y-2">
                <FieldLabel>Account</FieldLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full" aria-invalid={fieldState.invalid}>
                    <SelectValue placeholder="Select an account" />
                  </SelectTrigger>
                  <SelectContent>
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

          {/* Category (optional) */}
          <Controller
            name="category_id"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined} className="space-y-2">
                <FieldLabel>
                  Category
                  {' '}
                  <span className="text-muted-foreground font-normal">(optional)</span>
                </FieldLabel>
                <Select
                  value={field.value ?? NONE_CATEGORY_VALUE}
                  onValueChange={val => field.onChange(val === NONE_CATEGORY_VALUE ? undefined : val)}
                >
                  <SelectTrigger className="w-full" aria-invalid={fieldState.invalid}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE_CATEGORY_VALUE}>None</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
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
              {isPending ? 'Saving...' : transaction ? 'Save' : 'Create Transaction'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
