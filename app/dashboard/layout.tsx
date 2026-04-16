import { getCurrentUser } from '@/lib/insforge/server'
import { redirect } from 'next/navigation'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { ModeToggle } from '@/components/theme-toggle'
import { AppSidebar } from './components/app-sidebar'

export default async function DashboardLayout({
  children
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()
  if (!user) redirect('/sign-in')

  return (
    <SidebarProvider>
      <AppSidebar userEmail={user.email} />
      <SidebarInset className="flex flex-col flex-1">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
          <SidebarTrigger />
          <ModeToggle />
        </header>
        <main className="flex flex-1 flex-col">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
