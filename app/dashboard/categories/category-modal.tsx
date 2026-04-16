'use client'

import { useEffect, useState, useTransition } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { categorySchema, type Category, type CategoryValues } from '@/lib/schemas/categories'
import { slugify } from '@/lib/utils/slugify'
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
import { Field, FieldLabel, FieldError } from '@/components/ui/field'
import { Input } from '@/components/ui/input'

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
    defaultValues: { name: '', slug: '' },
    resolver: zodResolver(categorySchema)
  })

  const nameValue = form.watch('name')

  useEffect(() => {
    form.setValue('slug', slugify(nameValue))
  }, [nameValue, form])

  useEffect(() => {
    if (open) {
      form.reset(category ? { name: category.name, slug: category.slug } : { name: '', slug: '' })
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
              <Field data-invalid={fieldState.invalid || undefined} className="space-y-2">
                <FieldLabel>Category Name</FieldLabel>
                <Input
                  {...field}
                  id="name"
                  type="text"
                  placeholder="e.g. Groceries"
                  aria-invalid={fieldState.invalid}
                />
                <FieldError className="text-xs">{fieldState.error?.message}</FieldError>
              </Field>
            )}
          />

          <Controller
            name="slug"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined} className="space-y-2">
                <FieldLabel>Slug</FieldLabel>
                <Input
                  {...field}
                  id="slug"
                  type="text"
                  readOnly
                  className="bg-muted text-muted-foreground cursor-not-allowed"
                  aria-invalid={fieldState.invalid}
                />
                <FieldError className="text-xs">{fieldState.error?.message}</FieldError>
              </Field>
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
