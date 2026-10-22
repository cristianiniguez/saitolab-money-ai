'use client'

import { useState, useTransition } from 'react'
import { PencilIcon, Trash2Icon } from 'lucide-react'
import { type Loan } from '@/lib/schemas/loans'
import { toast } from 'sonner'
import { deleteLoan } from './actions'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

interface LoanRowProps {
  loan: Loan
  onEdit: () => void
  onSuccess: () => void
}

export function LoanRow({ loan, onEdit, onSuccess }: LoanRowProps) {
  const [isPending, startTransition] = useTransition()
  const [confirmOpen, setConfirmOpen] = useState(false)

  const formattedDate = new Date(loan.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })

  const handleConfirmDelete = () => {
    setConfirmOpen(false)
    startTransition(async () => {
      await deleteLoan(loan.id)
      toast.success('Loan deleted')
      onSuccess()
    })
  }

  return (
    <>
      <tr className="border-b border-border last:border-0">
        <td className="px-4 py-3 text-foreground">{formattedDate}</td>
        <td className="px-4 py-3 text-foreground">{loan.description || '—'}</td>
        <td className="px-4 py-3 text-muted-foreground">{loan.accounts?.name ?? '—'}</td>
        <td className="px-4 py-3">
          <span className={loan.direction === 'lent' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
            {loan.direction === 'lent' ? 'Lent' : 'Borrowed'}
          </span>
        </td>
        <td className={`px-4 py-3 text-right font-semibold tabular-nums ${loan.direction === 'lent' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
          {loan.direction === 'lent' ? '+' : '-'}{fmt(loan.amount)}
        </td>
        <td className="px-4 py-3">
          <div className="flex justify-end gap-1.5">
            <Button variant="outline" size="icon-sm" onClick={onEdit} aria-label="Edit loan">
              <PencilIcon />
            </Button>
            <Button
              variant="destructive"
              size="icon-sm"
              onClick={() => setConfirmOpen(true)}
              disabled={isPending}
              aria-label="Delete loan"
            >
              <Trash2Icon />
            </Button>
          </div>
        </td>
      </tr>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Delete loan</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this loan? This action cannot be undone.
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
