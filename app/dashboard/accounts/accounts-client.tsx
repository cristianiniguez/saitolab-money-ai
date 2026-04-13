'use client'

import { useState } from 'react'
import { PlusIcon, WalletIcon } from 'lucide-react'
import { type Account } from '@/lib/schemas/accounts'
import { AccountCard } from './account-card'
import { AccountModal } from './account-modal'
import { Button } from '@/components/ui/button'

interface AccountsClientProps {
  accounts: Account[]
}

export function AccountsClient({ accounts }: AccountsClientProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null)

  const openCreate = () => {
    setSelectedAccount(null)
    setModalOpen(true)
  }

  const openEdit = (account: Account) => {
    setSelectedAccount(account)
    setModalOpen(true)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Accounts</h1>
        <Button onClick={openCreate}>
          <PlusIcon />
          New Account
        </Button>
      </div>

      {accounts.length === 0
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
                />
              ))}
            </div>
          )}

      <AccountModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        account={selectedAccount}
      />
    </div>
  )
}
