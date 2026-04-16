'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowLeftRight, LayoutDashboard, Tags, Wallet } from 'lucide-react'
import { signOutAction } from '@/app/(main)/auth/actions'
import { Button } from '@/components/ui/button'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from '@/components/ui/sidebar'

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/dashboard/transactions', icon: ArrowLeftRight, label: 'Transactions' },
  { href: '/dashboard/accounts', icon: Wallet, label: 'Accounts' },
  { href: '/dashboard/categories', icon: Tags, label: 'Categories' }
]

export function AppSidebar({ userEmail }: { userEmail: string }) {
  const pathname = usePathname()

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border px-4 py-3">
        <Link href="/" className="font-bold text-lg text-sidebar-primary tracking-tight">
          SaitoLab Money
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map(({ href, icon: Icon, label }) => (
                <SidebarMenuItem key={href}>
                  <SidebarMenuButton asChild isActive={pathname === href}>
                    <Link href={href}>
                      <Icon />
                      <span>{label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className="flex flex-col gap-2">
          <span className="text-sm text-sidebar-foreground/60 truncate">{userEmail}</span>
          <form action={signOutAction}>
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              Sign Out
            </Button>
          </form>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
