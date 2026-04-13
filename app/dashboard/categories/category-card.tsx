'use client'

import { useState, useTransition } from 'react'
import { PencilIcon, Trash2Icon } from 'lucide-react'
import { type Category } from '@/lib/schemas/categories'
import { deleteCategory } from './actions'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'

interface CategoryCardProps {
  category: Category
  onEdit: () => void
  onSuccess: () => void
}

export function CategoryCard({ category, onEdit, onSuccess }: CategoryCardProps) {
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
          <CardTitle>{category.name}</CardTitle>
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
