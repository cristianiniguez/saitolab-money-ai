'use client'

import { useState, useTransition } from 'react'
import { PencilIcon, Trash2Icon } from 'lucide-react'
import { type ActivityItem } from '@/lib/activity'
import { toast } from 'sonner'
import { deleteTransaction } from '@/app/dashboard/transactions/actions'
import { deleteTransfer } from '@/app/dashboard/transfers/actions'
import { deleteLoan } from '@/app/dashboard/contacts/[slug]/actions'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'

const TYPE_BADGE: Record<ActivityItem['kind'], string> = {
  transaction: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  transfer: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  loan: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
}

const DELETE_LABEL: Record<ActivityItem['kind'], string> = {
  transaction: 'transaction',
  transfer: 'transfer',
  loan: 'loan'
}

function fmt(n: number, currencySymbol = 'USD') {
  try {
    return new Intl.NumberFormat('en-US', { currency: currencySymbol, style: 'currency' }).format(Math.abs(n))
  }
  catch {
    return `${currencySymbol} ${Math.abs(n).toFixed(2)}`
  }
}

async function deleteActivityItem(item: ActivityItem): Promise<void> {
  if (item.kind === 'transaction') await deleteTransaction(item.id)
  else if (item.kind === 'transfer') await deleteTransfer(item.id)
  else await deleteLoan(item.id)
}

interface ActivityRowProps {
  item: ActivityItem
  currencySymbol?: string
  onEdit: (item: ActivityItem) => void
  onSuccess: () => void
}

export function ActivityRow({ item, currencySymbol, onEdit, onSuccess }: ActivityRowProps) {
  const [isPending, startTransition] = useTransition()
  const [confirmOpen, setConfirmOpen] = useState(false)

  const formattedDate = new Date(item.date.length > 10 ? item.date : `${item.date}T00:00:00`).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })

  const handleConfirmDelete = () => {
    setConfirmOpen(false)
    startTransition(async () => {
      await deleteActivityItem(item)
      toast.success(`${DELETE_LABEL[item.kind].replace(/^./, c => c.toUpperCase())} deleted`)
      onSuccess()
    })
  }

  return (
    <>
      <tr className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors">
        <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">{formattedDate}</td>
        <td className="px-4 py-3 text-sm font-medium">{item.name}</td>
        <td className="px-4 py-3 text-sm text-muted-foreground">{item.detailLabel ?? '—'}</td>
        <td className="px-4 py-3">
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${TYPE_BADGE[item.kind]}`}>
            {item.typeLabel}
          </span>
        </td>
        <td
          className={`px-4 py-3 text-sm font-semibold tabular-nums text-right ${
            item.signedAmount < 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
          }`}
        >
          {item.signedAmount < 0 ? '-' : '+'}{fmt(item.signedAmount, currencySymbol)}
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center justify-end gap-1.5">
            <Button variant="outline" size="icon-sm" onClick={() => onEdit(item)} aria-label="Edit">
              <PencilIcon />
            </Button>
            <Button
              variant="destructive"
              size="icon-sm"
              onClick={() => setConfirmOpen(true)}
              disabled={isPending}
              aria-label="Delete"
            >
              <Trash2Icon />
            </Button>
          </div>
        </td>
      </tr>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Delete {DELETE_LABEL[item.kind]}</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{item.name}</strong>? This action cannot be undone.
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
