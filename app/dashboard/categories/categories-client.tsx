'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { PlusIcon, TagIcon, UploadIcon } from 'lucide-react'
import { type Category } from '@/lib/schemas/categories'
import { CategoryCard } from './category-card'
import { CategoryModal } from './category-modal'
import { ImportCsvModal } from './import-csv-modal'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

interface CategoriesClientProps {
  categories: Category[]
  balances: Record<string, number>
}

function CategoryCardSkeleton() {
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

export function CategoriesClient({ categories, balances }: CategoriesClientProps) {
  const router = useRouter()
  const [isRefreshing, startRefreshTransition] = useTransition()
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [importModalOpen, setImportModalOpen] = useState(false)

  const handleSuccess = () => {
    startRefreshTransition(() => {
      router.refresh()
    })
  }

  const openCreate = () => {
    setSelectedCategory(null)
    setModalOpen(true)
  }

  const openEdit = (category: Category) => {
    setSelectedCategory(category)
    setModalOpen(true)
  }

  const skeletonCount = Math.max(categories.length, 1)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Categories</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setImportModalOpen(true)} disabled={isRefreshing}>
            <UploadIcon />
            Import CSV
          </Button>
          <Button onClick={openCreate} disabled={isRefreshing}>
            <PlusIcon />
            New Category
          </Button>
        </div>
      </div>

      {isRefreshing
        ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: skeletonCount }).map((_, i) => (
                <CategoryCardSkeleton key={i} />
              ))}
            </div>
          )
        : categories.length === 0
          ? (
              <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border bg-muted/20 py-20 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <TagIcon className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="space-y-1">
                  <p className="font-medium text-foreground">No categories yet</p>
                  <p className="text-sm text-muted-foreground">
                    Create your first category to start organizing your transactions.
                  </p>
                </div>
                <Button onClick={openCreate}>
                  <PlusIcon />
                  Create your first category
                </Button>
              </div>
            )
          : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {categories.map(category => (
                  <CategoryCard
                    key={category.id}
                    category={category}
                    balance={balances[category.id] ?? 0}
                    onEdit={() => openEdit(category)}
                    onSuccess={handleSuccess}
                  />
                ))}
              </div>
            )}

      <CategoryModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        category={selectedCategory}
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
