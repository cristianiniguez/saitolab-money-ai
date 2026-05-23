'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { PencilIcon, Trash2Icon } from 'lucide-react'
import { type Account } from '@/lib/schemas/accounts'
import { convertCurrency } from '@/lib/utils/currency'
import { toast } from 'sonner'
import { deleteAccount } from './actions'
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

const TYPE_BADGE: Record<Account['type'], { label: string, className: string }> = {
  bank: { className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', label: 'Bank' },
  crypto: { className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', label: 'Crypto' },
  wallet: { className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', label: 'Wallet' }
}

const fmt = (n: number, currencySymbol = 'USD') => {
  try {
    return new Intl.NumberFormat('en-US', { currency: currencySymbol, style: 'currency' }).format(n)
  }
  catch {
    return `${currencySymbol} ${n.toFixed(2)}`
  }
}

interface AccountCardProps {
  account: Account
  balance: number
  onEdit: () => void
  onSuccess: () => void
  mainCurrency?: { symbol: string, slug: string, rate_usd: number } | null
}

export function AccountCard({ account, balance, onEdit, onSuccess, mainCurrency }: AccountCardProps) {
  const [isPending, startTransition] = useTransition()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const badge = TYPE_BADGE[account.type]

  const accountRateUsd = account.currencies?.rate_usd ?? 1
  const showConverted = mainCurrency != null
    && account.currencies != null
    && mainCurrency.slug !== account.currencies.symbol.toLowerCase()

  const handleConfirmDelete = () => {
    setConfirmOpen(false)
    startTransition(async () => {
      await deleteAccount(account.id)
      toast.success('Account deleted')
      onSuccess()
    })
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>
            <Link
              href={`/dashboard/accounts/${account.slug}`}
              className="hover:underline"
            >
              {account.name}
            </Link>
          </CardTitle>
          <CardAction>
            <div className="flex gap-1.5">
              <Button variant="outline" size="icon-sm" onClick={onEdit} aria-label="Edit account">
                <PencilIcon />
              </Button>
              <Button
                variant="destructive"
                size="icon-sm"
                onClick={() => setConfirmOpen(true)}
                disabled={isPending}
                aria-label="Delete account"
              >
                <Trash2Icon />
              </Button>
            </div>
          </CardAction>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.className}`}>
            {badge.label}
          </span>
          <div className="flex flex-col items-end gap-0.5">
            <span className={`text-sm font-semibold tabular-nums ${balance < 0 ? 'text-destructive' : 'text-foreground'}`}>
              {fmt(balance, account.currencies?.symbol)}
            </span>
            {showConverted && (
              <span className="text-xs text-muted-foreground tabular-nums">
                ≈ {fmt(convertCurrency(balance, accountRateUsd, mainCurrency!.rate_usd), mainCurrency!.symbol)}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Delete account</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete
              {' '}
              <strong>{account.name}</strong>
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
