'use client'

import { useEffect, useState, useTransition } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { contactSchema, type Contact, type ContactValues } from '@/lib/schemas/contacts'
import { slugify } from '@/lib/utils/slugify'
import { toast } from 'sonner'
import { createContact, updateContact } from './actions'
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

interface ContactModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  contact?: Contact | null
  onSuccess: () => void
}

export function ContactModal({ open, onOpenChange, contact, onSuccess }: ContactModalProps) {
  const [isPending, startTransition] = useTransition()
  const [serverError, setServerError] = useState<string | null>(null)

  const form = useForm<ContactValues>({
    defaultValues: { name: '', slug: '' },
    resolver: zodResolver(contactSchema)
  })

  const nameValue = form.watch('name')

  useEffect(() => {
    form.setValue('slug', slugify(nameValue))
  }, [nameValue, form])

  useEffect(() => {
    if (open) {
      form.reset(contact ? { name: contact.name, slug: contact.slug } : { name: '', slug: '' })
      setServerError(null)
    }
  }, [open, contact, form])

  const onSubmit = (data: ContactValues) => {
    setServerError(null)
    startTransition(async () => {
      const res = contact
        ? await updateContact(contact.id, data)
        : await createContact(data)
      if (res.success) {
        toast.success(contact ? 'Contact updated' : 'Contact created')
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
          <DialogTitle>{contact ? 'Edit Contact' : 'New Contact'}</DialogTitle>
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
                <FieldLabel>Contact Name</FieldLabel>
                <Input
                  {...field}
                  id="name"
                  type="text"
                  placeholder="e.g. Jane Doe"
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
              {isPending ? 'Saving...' : contact ? 'Save' : 'Create Contact'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
