'use client'

import { useEffect, useState, useTransition } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Field } from '@base-ui/react/field'
import { categorySchema, type Category, type CategoryValues } from '@/lib/schemas/categories'
import { createCategory, updateCategory } from './actions'
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

interface CategoryModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  category?: Category | null
  onSuccess: () => void
}

export function CategoryModal({ open, onOpenChange, category, onSuccess }: CategoryModalProps) {
  const [isPending, startTransition] = useTransition()
  const [serverError, setServerError] = useState<string | null>(null)

  const form = useForm<CategoryValues>({
    defaultValues: { name: '' },
    resolver: zodResolver(categorySchema)
  })

  useEffect(() => {
    if (open) {
      form.reset(category ? { name: category.name } : { name: '' })
      setServerError(null)
    }
  }, [open, category, form])

  const onSubmit = (data: CategoryValues) => {
    setServerError(null)
    startTransition(async () => {
      const res = category
        ? await updateCategory(category.id, data)
        : await createCategory(data)
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
          <DialogTitle>{category ? 'Edit Category' : 'New Category'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-2">
          {serverError && (
            <Alert variant="destructive">
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          )}

          <Controller
            name="name"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field.Root invalid={fieldState.invalid} className="space-y-2">
                <Field.Label render={<Label />}>Category Name</Field.Label>
                <Input
                  {...field}
                  id="name"
                  type="text"
                  placeholder="e.g. Groceries"
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
              {isPending ? 'Saving...' : category ? 'Save' : 'Create Category'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
