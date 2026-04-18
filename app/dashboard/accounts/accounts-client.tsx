'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { PlusIcon, UploadIcon, WalletIcon } from 'lucide-react'
import { type Account } from '@/lib/schemas/accounts'
import { AccountCard } from './account-card'
import { AccountModal } from './account-modal'
import { ImportCsvModal } from './import-csv-modal'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

interface AccountsClientProps {
  accounts: Account[]
}

function AccountCardSkeleton() {
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
        <Skeleton className="h-5 w-14 rounded-full" />
      </div>
    </div>
  )
}

export function AccountsClient({ accounts }: AccountsClientProps) {
  const router = useRouter()
  const [isRefreshing, startRefreshTransition] = useTransition()
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null)
  const [importModalOpen, setImportModalOpen] = useState(false)

  const handleSuccess = () => {
    startRefreshTransition(() => {
      router.refresh()
    })
  }

  const openCreate = () => {
    setSelectedAccount(null)
    setModalOpen(true)
  }

  const openEdit = (account: Account) => {
    setSelectedAccount(account)
    setModalOpen(true)
  }

  const skeletonCount = Math.max(accounts.length, 1)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Accounts</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setImportModalOpen(true)} disabled={isRefreshing}>
            <UploadIcon />
            Import CSV
          </Button>
          <Button onClick={openCreate} disabled={isRefreshing}>
            <PlusIcon />
            New Account
          </Button>
        </div>
      </div>

      {isRefreshing
        ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: skeletonCount }).map((_, i) => (
                <AccountCardSkeleton key={i} />
              ))}
            </div>
          )
        : accounts.length === 0
          ? (
              <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border bg-muted/20 py-20 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <WalletIcon className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="space-y-1">
                  <p className="font-medium text-foreground">No accounts yet</p>
                  <p className="text-sm text-muted-foreground">
                    Create your first account to start tracking your finances.
                  </p>
                </div>
                <Button onClick={openCreate}>
                  <PlusIcon />
                  Create your first account
                </Button>
              </div>
            )
          : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {accounts.map(account => (
                  <AccountCard
                    key={account.id}
                    account={account}
                    onEdit={() => openEdit(account)}
                    onSuccess={handleSuccess}
                  />
                ))}
              </div>
            )}

      <AccountModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        account={selectedAccount}
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
