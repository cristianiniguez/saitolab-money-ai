'use client'

import { useState, useTransition } from 'react'
import { PencilIcon, Trash2Icon } from 'lucide-react'
import { type Transaction } from '@/lib/schemas/transactions'
import { deleteTransaction } from './actions'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'

interface TransactionRowProps {
  transaction: Transaction
  onEdit: () => void
  onSuccess: () => void
}

const TYPE_BADGE = {
  income: { label: 'Income', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  expense: { label: 'Expense', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' }
}

export function TransactionRow({ transaction, onEdit, onSuccess }: TransactionRowProps) {
  const [isPending, startTransition] = useTransition()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const badge = TYPE_BADGE[transaction.type]

  const formattedDate = new Date(transaction.date + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })

  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(transaction.amount)

  const handleConfirmDelete = () => {
    setConfirmOpen(false)
    startTransition(async () => {
      await deleteTransaction(transaction.id)
      onSuccess()
    })
  }

  return (
    <>
      <tr className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors">
        <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">{formattedDate}</td>
        <td className="px-4 py-3 text-sm font-medium">{transaction.name}</td>
        <td className="px-4 py-3 text-sm text-muted-foreground">{transaction.accounts?.name ?? '—'}</td>
        <td className="px-4 py-3 text-sm text-muted-foreground">{transaction.categories?.name ?? '—'}</td>
        <td className="px-4 py-3">
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.className}`}>
            {badge.label}
          </span>
        </td>
        <td className="px-4 py-3 text-sm font-medium tabular-nums text-right">{formattedAmount}</td>
        <td className="px-4 py-3">
          <div className="flex items-center justify-end gap-1.5">
            <Button variant="outline" size="icon-sm" onClick={onEdit} aria-label="Edit transaction">
              <PencilIcon />
            </Button>
            <Button
              variant="destructive"
              size="icon-sm"
              onClick={() => setConfirmOpen(true)}
              disabled={isPending}
              aria-label="Delete transaction"
            >
              <Trash2Icon />
            </Button>
          </div>
        </td>
      </tr>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Delete transaction</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete
              {' '}
              <strong>{transaction.name}</strong>
              ?
              {' '}
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete} disabled={isPending}>
              {isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
