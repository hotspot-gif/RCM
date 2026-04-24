"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  FileSignature,
  LayoutDashboard,
  FileText,
  PlusSquare,
  Users,
} from "lucide-react"
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
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import type { AppUser } from "@/lib/types"

export function AppSidebar({ user }: { user: AppUser }) {
  const pathname = usePathname()

  const nav = [
    { href: "/dashboard", label: "Overview", icon: LayoutDashboard, show: true },
    { href: "/dashboard/contracts", label: "Contracts", icon: FileText, show: true },
    {
      href: "/dashboard/contracts/new",
      label: "New contract",
      icon: PlusSquare,
      show: true,
    },
    {
      href: "/dashboard/users",
      label: "Users",
      icon: Users,
      show: user.role === "ADMIN",
    },
  ]

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#245bc1] text-white">
            <FileSignature className="h-4 w-4" aria-hidden="true" />
          </div>
          <div className="flex flex-col overflow-hidden group-data-[collapsible=icon]:hidden">
            <span className="truncate text-sm font-semibold text-sidebar-foreground">
              Contract Manager
            </span>
            <span className="truncate text-xs text-sidebar-foreground/70">
              Universal Service 2006
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {nav
                .filter((n) => n.show)
                .map((n) => {
                  const active =
                    n.href === "/dashboard"
                      ? pathname === "/dashboard"
                      : pathname.startsWith(n.href)
                  return (
                    <SidebarMenuItem key={n.href}>
                      <SidebarMenuButton asChild isActive={active} tooltip={n.label}>
                        <Link href={n.href}>
                          <n.icon aria-hidden="true" />
                          <span>{n.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="flex items-center gap-2 px-2 py-1.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#ffc8b2] text-[11px] font-semibold text-[#21264e]">
            {user.full_name
              .split(" ")
              .map((s) => s[0])
              .slice(0, 2)
              .join("")
              .toUpperCase()}
          </div>
          <div className="flex min-w-0 flex-col group-data-[collapsible=icon]:hidden">
            <span className="truncate text-sm font-medium text-sidebar-foreground">
              {user.full_name}
            </span>
            <span className="truncate text-xs text-sidebar-foreground/70">
              {user.role}
              {user.branch ? ` · ${user.branch}` : ""}
            </span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
