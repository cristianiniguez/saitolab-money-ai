'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { PencilIcon, Trash2Icon } from 'lucide-react'
import { type Category } from '@/lib/schemas/categories'
import { deleteCategory } from './actions'
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
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

interface CategoryCardProps {
  category: Category
  balance: number
  onEdit: () => void
  onSuccess: () => void
}

export function CategoryCard({ category, balance, onEdit, onSuccess }: CategoryCardProps) {
  const [isPending, startTransition] = useTransition()
  const [confirmOpen, setConfirmOpen] = useState(false)

  const handleConfirmDelete = () => {
    setConfirmOpen(false)
    startTransition(async () => {
      await deleteCategory(category.id)
      onSuccess()
    })
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>
            <Link href={`/dashboard/categories/${category.slug}`} className="hover:underline">
              {category.name}
            </Link>
          </CardTitle>
          <CardAction>
            <div className="flex gap-1.5">
              <Button variant="outline" size="icon-sm" onClick={onEdit} aria-label="Edit category">
                <PencilIcon />
              </Button>
              <Button
                variant="destructive"
                size="icon-sm"
                onClick={() => setConfirmOpen(true)}
                disabled={isPending}
                aria-label="Delete category"
              >
                <Trash2Icon />
              </Button>
            </div>
          </CardAction>
        </CardHeader>
        <CardContent>
          <span className={`text-sm font-semibold tabular-nums ${balance < 0 ? 'text-destructive' : 'text-foreground'}`}>
            {fmt(balance)}
          </span>
        </CardContent>
      </Card>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Delete category</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete
              {' '}
              <strong>{category.name}</strong>
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
