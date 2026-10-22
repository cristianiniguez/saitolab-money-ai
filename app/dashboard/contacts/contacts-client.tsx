'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { PlusIcon, UsersIcon, UploadIcon } from 'lucide-react'
import { type Contact } from '@/lib/schemas/contacts'
import { ContactCard } from './contact-card'
import { ContactModal } from './contact-modal'
import { ImportCsvModal } from './import-csv-modal'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

interface ContactsClientProps {
  contacts: Contact[]
  balances: Record<string, number>
}

function ContactCardSkeleton() {
  return (
    <div className="flex flex-col gap-4 overflow-hidden rounded-xl py-4 ring-1 ring-foreground/10">
      <div className="grid auto-rows-min items-start gap-1 px-4 grid-cols-[1fr_auto]">
        <Skeleton className="h-4 w-2/3" />
        <div className="flex gap-1.5">
          <Skeleton className="size-6 rounded-md" />
          <Skeleton className="size-6 rounded-md" />
        </div>
      </div>
      <div className="px-4">
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
  )
}

export function ContactsClient({ contacts, balances }: ContactsClientProps) {
  const router = useRouter()
  const [isRefreshing, startRefreshTransition] = useTransition()
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [importModalOpen, setImportModalOpen] = useState(false)

  const handleSuccess = () => {
    startRefreshTransition(() => {
      router.refresh()
    })
  }

  const openCreate = () => {
    setSelectedContact(null)
    setModalOpen(true)
  }

  const openEdit = (contact: Contact) => {
    setSelectedContact(contact)
    setModalOpen(true)
  }

  const skeletonCount = Math.max(contacts.length, 1)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Contacts</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setImportModalOpen(true)} disabled={isRefreshing}>
            <UploadIcon />
            Import CSV
          </Button>
          <Button onClick={openCreate} disabled={isRefreshing}>
            <PlusIcon />
            New Contact
          </Button>
        </div>
      </div>

      {isRefreshing
        ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: skeletonCount }).map((_, i) => (
                <ContactCardSkeleton key={i} />
              ))}
            </div>
          )
        : contacts.length === 0
          ? (
              <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border bg-muted/20 py-20 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <UsersIcon className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="space-y-1">
                  <p className="font-medium text-foreground">No contacts yet</p>
                  <p className="text-sm text-muted-foreground">
                    Create your first contact to start tracking loans with them.
                  </p>
                </div>
                <Button onClick={openCreate}>
                  <PlusIcon />
                  Create your first contact
                </Button>
              </div>
            )
          : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {contacts.map(contact => (
                  <ContactCard
                    key={contact.id}
                    contact={contact}
                    balance={balances[contact.id] ?? 0}
                    onEdit={() => openEdit(contact)}
                    onSuccess={handleSuccess}
                  />
                ))}
              </div>
            )}

      <ContactModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        contact={selectedContact}
        onSuccess={handleSuccess}
      />
      <ImportCsvModal
        open={importModalOpen}
        onOpenChange={setImportModalOpen}
        onSuccess={handleSuccess}
      />
    </div>
  )
}
