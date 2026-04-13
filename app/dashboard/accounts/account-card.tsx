'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { PencilIcon, Trash2Icon } from 'lucide-react'
import { type Account } from '@/lib/schemas/accounts'
import { deleteAccount } from './actions'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'

const TYPE_BADGE: Record<Account['type'], { label: string, className: string }> = {
  bank: { className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', label: 'Bank' },
  crypto: { className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', label: 'Crypto' },
  wallet: { className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', label: 'Wallet' }
}

interface AccountCardProps {
  account: Account
  onEdit: () => void
}

export function AccountCard({ account, onEdit }: AccountCardProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const badge = TYPE_BADGE[account.type]

  const handleConfirmDelete = () => {
    startTransition(async () => {
      await deleteAccount(account.id)
      router.refresh()
    })
    setConfirmOpen(false)
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{account.name}</CardTitle>
          <CardAction>
            <div className="flex gap-1.5">
              <Button variant="outline" size="icon-sm" onClick={onEdit} aria-label="Edit account">
                <PencilIcon />
              </Button>
              <Button
                variant="destructive"
                size="icon-sm"
                onClick={() => setConfirmOpen(true)}
                disabled={isPending}
                aria-label="Delete account"
              >
                <Trash2Icon />
              </Button>
            </div>
          </CardAction>
        </CardHeader>
        <CardContent>
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.className}`}>
            {badge.label}
          </span>
        </CardContent>
      </Card>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Delete account</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete
              {' '}
              <strong>{account.name}</strong>
              ? This action cannot be undone.
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
