'use client'

import { useRef, useState, useTransition } from 'react'
import { UploadIcon, FileIcon, AlertCircleIcon, CheckCircle2Icon } from 'lucide-react'
import { parseCsv } from '@/lib/utils/parse-csv'
import { importTransactions } from './actions'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'

const REQUIRED_HEADERS = ['name', 'date', 'amount', 'type', 'account_slug']
const ALL_HEADERS = ['name', 'date', 'amount', 'type']
const TEMPLATE_ROWS = [
  'name,date,amount,type,account_slug,category_slug',
  'Salary,2024-01-15,5000,income,checking-account,',
  'Coffee,2024-01-16,5.50,expense,checking-account,food',
  'Groceries,2024-01-17,85.00,expense,my-wallet,food'
]

interface ImportCsvModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

type Step = 'upload' | 'preview' | 'done'

export function ImportCsvModal({ open, onOpenChange, onSuccess }: ImportCsvModalProps) {
  const [step, setStep] = useState<Step>('upload')
  const [headerErrors, setHeaderErrors] = useState<string[]>([])
  const [rows, setRows] = useState<Array<Record<string, string>>>([])
  const [isPending, startTransition] = useTransition()
  const [importResult, setImportResult] = useState<{
    imported: number
    errors: Array<{ row: number, message: string }>
    serverError?: string
  } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const reset = () => {
    setStep('upload')
    setHeaderErrors([])
    setRows([])
    setImportResult(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) reset()
    onOpenChange(open)
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const result = await parseCsv<Record<string, string>>(file, REQUIRED_HEADERS)
    if (result.headerErrors.length > 0) {
      setHeaderErrors(result.headerErrors)
      setRows([])
      setStep('preview')
      return
    }
    setHeaderErrors([])
    setRows(result.rows)
    setStep('preview')
  }

  const downloadTemplate = () => {
    const blob = new Blob([TEMPLATE_ROWS.join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'transactions-template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = () => {
    startTransition(async () => {
      const result = await importTransactions(rows)
      setImportResult({
        imported: result.imported,
        errors: result.errors,
        serverError: result.error
      })
      if (result.success && result.imported > 0) {
        setStep('done')
        onSuccess()
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Import Transactions from CSV</DialogTitle>
        </DialogHeader>

        {step === 'upload' && (
          <div className="space-y-4 mt-2">
            <p className="text-sm text-muted-foreground">
              Upload a CSV file with columns: <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">{ALL_HEADERS.join(', ')}</code>.
            </p>
            <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
              <li><code className="font-mono bg-muted px-1 py-0.5 rounded">date</code> format: YYYY-MM-DD</li>
              <li><code className="font-mono bg-muted px-1 py-0.5 rounded">type</code> must be <code className="font-mono bg-muted px-1 py-0.5 rounded">income</code> or <code className="font-mono bg-muted px-1 py-0.5 rounded">expense</code></li>
              <li><code className="font-mono bg-muted px-1 py-0.5 rounded">account_slug</code> must match an existing account slug</li>
              <li><code className="font-mono bg-muted px-1 py-0.5 rounded">category_slug</code> is optional</li>
            </ul>
            <button
              type="button"
              onClick={downloadTemplate}
              className="text-sm text-primary underline underline-offset-2 hover:opacity-80"
            >
              Download template CSV
            </button>
            <label className="flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-border bg-muted/20 px-6 py-10 cursor-pointer hover:bg-muted/40 transition-colors">
              <UploadIcon className="size-8 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Click to browse or drag a CSV file here</span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                className="sr-only"
                onChange={handleFileChange}
              />
            </label>
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-4 mt-2">
            {headerErrors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircleIcon className="size-4" />
                <AlertDescription>{headerErrors[0]}</AlertDescription>
              </Alert>
            )}

            {headerErrors.length === 0 && (
              <>
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{rows.length} row{rows.length !== 1 ? 's' : ''}</span> found. Preview of first 5:
                </p>
                <div className="overflow-auto rounded-md border border-border max-h-48">
                  <table className="w-full text-xs">
                    <thead className="bg-muted sticky top-0">
                      <tr>
                        {ALL_HEADERS.map(h => (
                          <th key={h} className="px-3 py-2 text-left font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.slice(0, 5).map((row, i) => (
                        <tr key={i} className="border-t border-border">
                          {ALL_HEADERS.map(h => (
                            <td key={h} className="px-3 py-2 text-foreground whitespace-nowrap">{row[h] ?? ''}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {importResult?.errors && importResult.errors.length > 0 && (
              <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 space-y-1 max-h-32 overflow-auto">
                <p className="text-xs font-medium text-destructive">Rows with errors (will be skipped):</p>
                {importResult.errors.map(e => (
                  <p key={e.row} className="text-xs text-destructive">Row {e.row}: {e.message}</p>
                ))}
              </div>
            )}

            {importResult?.serverError && (
              <Alert variant="destructive">
                <AlertDescription>{importResult.serverError}</AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {step === 'done' && (
          <div className="mt-2 flex flex-col items-center gap-3 py-6 text-center">
            <CheckCircle2Icon className="size-10 text-green-500" />
            <p className="font-medium text-foreground">
              {importResult?.imported} transaction{importResult?.imported !== 1 ? 's' : ''} imported successfully
            </p>
            {importResult?.errors && importResult.errors.length > 0 && (
              <p className="text-sm text-muted-foreground">
                {importResult.errors.length} row{importResult.errors.length !== 1 ? 's' : ''} skipped due to errors
              </p>
            )}
          </div>
        )}

        <DialogFooter>
          {step === 'upload' && (
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          )}
          {step === 'preview' && (
            <>
              <Button type="button" variant="outline" onClick={reset} disabled={isPending}>
                <FileIcon className="size-4" />
                Choose another file
              </Button>
              {headerErrors.length === 0 && (
                <Button
                  type="button"
                  onClick={handleImport}
                  disabled={isPending || rows.length === 0}
                >
                  {isPending ? 'Importing...' : `Import ${rows.length} row${rows.length !== 1 ? 's' : ''}`}
                </Button>
              )}
            </>
          )}
          {step === 'done' && (
            <Button type="button" onClick={() => handleOpenChange(false)}>
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
