'use client'

import { useEffect, useState, useTransition } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Field } from '@base-ui/react/field'
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
              <Field.Root invalid={fieldState.invalid} className="space-y-2">
                <Field.Label render={<Label />}>Name</Field.Label>
                <Input
                  {...field}
                  type="text"
                  placeholder="e.g. Monthly salary"
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

          {/* Date */}
          <Controller
            name="date"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field.Root invalid={fieldState.invalid} className="space-y-2">
                <Field.Label render={<Label />}>Date</Field.Label>
                <Input
                  {...field}
                  type="date"
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

          {/* Amount */}
          <Controller
            name="amount"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field.Root invalid={fieldState.invalid} className="space-y-2">
                <Field.Label render={<Label />}>Amount</Field.Label>
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
                {fieldState.error && (
                  <Field.Error match={true} className="text-xs text-destructive">
                    {fieldState.error.message}
                  </Field.Error>
                )}
              </Field.Root>
            )}
          />

          {/* Type */}
          <Controller
            name="type"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field.Root invalid={fieldState.invalid} className="space-y-2">
                <Field.Label render={<Label />}>Type</Field.Label>
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
                {fieldState.error && (
                  <Field.Error match={true} className="text-xs text-destructive">
                    {fieldState.error.message}
                  </Field.Error>
                )}
              </Field.Root>
            )}
          />

          {/* Account */}
          <Controller
            name="account_id"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field.Root invalid={fieldState.invalid} className="space-y-2">
                <Field.Label render={<Label />}>Account</Field.Label>
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
                {fieldState.error && (
                  <Field.Error match={true} className="text-xs text-destructive">
                    {fieldState.error.message}
                  </Field.Error>
                )}
              </Field.Root>
            )}
          />

          {/* Category (optional) */}
          <Controller
            name="category_id"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field.Root invalid={fieldState.invalid} className="space-y-2">
                <Field.Label render={<Label />}>
                  Category
                  {' '}
                  <span className="text-muted-foreground font-normal">(optional)</span>
                </Field.Label>
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
              {isPending ? 'Saving...' : transaction ? 'Save' : 'Create Transaction'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
