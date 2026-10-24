'use client'

import { useState, useTransition } from 'react'
import { PencilIcon, Trash2Icon } from 'lucide-react'
import { type Transfer } from '@/lib/schemas/transfers'
import { toast } from 'sonner'
import { deleteTransfer } from './actions'
import { formatMoney } from '@/lib/utils/currency'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'

interface TransferRowProps {
  transfer: Transfer
  fromAccountName?: string
  toAccountName?: string
  fromCurrency?: string
  toCurrency?: string
  onEdit: () => void
  onSuccess: () => void
}

export function TransferRow({ transfer, fromAccountName, toAccountName, fromCurrency, toCurrency, onEdit, onSuccess }: TransferRowProps) {
  const [isPending, startTransition] = useTransition()
  const [confirmOpen, setConfirmOpen] = useState(false)

  const formattedDate = new Date(transfer.date + 'T00:00:00').toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })

  const handleConfirmDelete = () => {
    setConfirmOpen(false)
    startTransition(async () => {
      await deleteTransfer(transfer.id)
      toast.success('Transfer deleted')
      onSuccess()
    })
  }

  return (
    <>
      <tr className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors">
        <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">{formattedDate}</td>
        <td className="px-4 py-3 text-sm font-medium">{transfer.name}</td>
        <td className="px-4 py-3 text-sm text-muted-foreground">{fromAccountName ?? '—'}</td>
        <td className="px-4 py-3 text-sm text-muted-foreground">{toAccountName ?? '—'}</td>
        <td className="px-4 py-3 text-sm font-medium tabular-nums text-right">
          {formatMoney(transfer.amount, fromCurrency)}
          {(transfer.to_amount !== transfer.amount || fromCurrency !== toCurrency) && (
            <span className="block text-xs font-normal text-muted-foreground">
              →
              {' '}
              {formatMoney(transfer.to_amount, toCurrency)}
            </span>
          )}
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center justify-end gap-1.5">
            <Button variant="outline" size="icon-sm" onClick={onEdit} aria-label="Edit transfer">
              <PencilIcon />
            </Button>
            <Button
              variant="destructive"
              size="icon-sm"
              onClick={() => setConfirmOpen(true)}
              disabled={isPending}
              aria-label="Delete transfer"
            >
              <Trash2Icon />
            </Button>
          </div>
        </td>
      </tr>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Delete transfer</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete
              {' '}
              <strong>{transfer.name}</strong>
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
