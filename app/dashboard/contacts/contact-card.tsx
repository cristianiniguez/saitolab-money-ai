'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { PencilIcon, Trash2Icon } from 'lucide-react'
import { type Contact } from '@/lib/schemas/contacts'
import { toast } from 'sonner'
import { deleteContact } from './actions'
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

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { currency: 'USD', style: 'currency' }).format(Math.abs(n))

interface ContactCardProps {
  contact: Contact
  balance: number
  onEdit: () => void
  onSuccess: () => void
}

export function ContactCard({ contact, balance, onEdit, onSuccess }: ContactCardProps) {
  const [isPending, startTransition] = useTransition()
  const [confirmOpen, setConfirmOpen] = useState(false)

  const handleConfirmDelete = () => {
    setConfirmOpen(false)
    startTransition(async () => {
      await deleteContact(contact.id)
      toast.success('Contact deleted')
      onSuccess()
    })
  }

  const balanceLabel = balance === 0 ? 'Settled' : balance > 0 ? 'Owes you' : 'You owe'

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>
            <Link href={`/dashboard/contacts/${contact.slug}`} className="hover:underline">
              {contact.name}
            </Link>
          </CardTitle>
          <CardAction>
            <div className="flex gap-1.5">
              <Button variant="outline" size="icon-sm" onClick={onEdit} aria-label="Edit contact">
                <PencilIcon />
              </Button>
              <Button
                variant="destructive"
                size="icon-sm"
                onClick={() => setConfirmOpen(true)}
                disabled={isPending}
                aria-label="Delete contact"
              >
                <Trash2Icon />
              </Button>
            </div>
          </CardAction>
        </CardHeader>
        <CardContent className="flex items-center gap-2">
          <span className={`text-sm font-semibold tabular-nums ${balance < 0 ? 'text-destructive' : 'text-foreground'}`}>
            {fmt(balance)}
          </span>
          <span className="text-xs text-muted-foreground">{balanceLabel}</span>
        </CardContent>
      </Card>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Delete contact</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete
              {' '}
              <strong>{contact.name}</strong>
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
