'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRightLeftIcon, PlusIcon, UploadIcon } from 'lucide-react'
import { type Transfer } from '@/lib/schemas/transfers'
import { type Account } from '@/lib/schemas/accounts'
import { TransferRow } from './transfer-row'
import { TransferModal } from './transfer-modal'
import { ImportCsvModal } from './import-csv-modal'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

interface TransfersClientProps {
  transfers: Transfer[]
  accounts: Account[]
}

function TableHead() {
  return (
    <thead>
      <tr className="border-b border-border bg-muted/50">
        <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
        <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
        <th className="px-4 py-3 text-left font-medium text-muted-foreground">From</th>
        <th className="px-4 py-3 text-left font-medium text-muted-foreground">To</th>
        <th className="px-4 py-3 text-right font-medium text-muted-foreground">Amount</th>
        <th className="px-4 py-3" />
      </tr>
    </thead>
  )
}

function TableRowSkeleton() {
  return (
    <tr className="border-b border-border">
      <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
      <td className="px-4 py-3"><Skeleton className="h-4 w-32" /></td>
      <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
      <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
      <td className="px-4 py-3"><Skeleton className="h-4 w-16 ml-auto" /></td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1.5">
          <Skeleton className="size-6 rounded-md" />
          <Skeleton className="size-6 rounded-md" />
        </div>
      </td>
    </tr>
  )
}

export function TransfersClient({ transfers, accounts }: TransfersClientProps) {
  const router = useRouter()
  const [isRefreshing, startRefreshTransition] = useTransition()
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedTransfer, setSelectedTransfer] = useState<Transfer | null>(null)
  const [importModalOpen, setImportModalOpen] = useState(false)

  const accountNames = new Map(accounts.map(a => [a.id, a.name]))

  const handleSuccess = () => {
    startRefreshTransition(() => {
      router.refresh()
    })
  }

  const openCreate = () => {
    setSelectedTransfer(null)
    setModalOpen(true)
  }

  const openEdit = (transfer: Transfer) => {
    setSelectedTransfer(transfer)
    setModalOpen(true)
  }

  const skeletonCount = Math.max(transfers.length, 1)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Transfers</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setImportModalOpen(true)} disabled={isRefreshing}>
            <UploadIcon />
            Import CSV
          </Button>
          <Button onClick={openCreate} disabled={isRefreshing}>
            <PlusIcon />
            New Transfer
          </Button>
        </div>
      </div>

      {isRefreshing
        ? (
            <div className="overflow-hidden rounded-xl ring-1 ring-foreground/10">
              <table className="w-full text-sm">
                <TableHead />
                <tbody>
                  {Array.from({ length: skeletonCount }).map((_, i) => (
                    <TableRowSkeleton key={i} />
                  ))}
                </tbody>
              </table>
            </div>
          )
        : transfers.length === 0
          ? (
              <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border bg-muted/20 py-20 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <ArrowRightLeftIcon className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="space-y-1">
                  <p className="font-medium text-foreground">No transfers yet</p>
                  <p className="text-sm text-muted-foreground">
                    Record money moving between your accounts.
                  </p>
                </div>
                <Button onClick={openCreate}>
                  <PlusIcon />
                  Create your first transfer
                </Button>
              </div>
            )
          : (
              <div className="overflow-hidden rounded-xl ring-1 ring-foreground/10">
                <table className="w-full text-sm">
                  <TableHead />
                  <tbody>
                    {transfers.map(transfer => (
                      <TransferRow
                        key={transfer.id}
                        transfer={transfer}
                        fromAccountName={accountNames.get(transfer.from_account_id)}
                        toAccountName={accountNames.get(transfer.to_account_id)}
                        onEdit={() => openEdit(transfer)}
                        onSuccess={handleSuccess}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}

      <TransferModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        transfer={selectedTransfer}
        accounts={accounts}
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
