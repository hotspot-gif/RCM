"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  FileSignature,
  LayoutDashboard,
  FileText,
  PlusSquare,
  Users,
  UserCircle,
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
import { useI18n } from "@/lib/i18n/i18n-context"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import type { AppUser } from "@/lib/types"

export function AppSidebar({ user }: { user: AppUser }) {
  const pathname = usePathname()
  const { t, language, setLanguage } = useI18n()

  const nav = [
    { href: "/dashboard", label: t("overview"), icon: LayoutDashboard, show: true },
    { href: "/dashboard/contracts", label: t("contracts"), icon: FileText, show: true },
    {
      href: "/dashboard/contracts/new",
      label: t("newContract"),
      icon: PlusSquare,
      show: true,
    },
    {
      href: "/dashboard/users",
      label: t("users"),
      icon: Users,
      show: user.role === "ADMIN",
    },
    {
      href: "/dashboard/profile",
      label: t("profileSettings"),
      icon: UserCircle,
      show: true,
    },
  ]

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="pointer-events-none group-data-[collapsible=icon]:!p-0 group-data-[collapsible=icon]:justify-center">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#245bc1] text-white">
                <FileSignature className="h-4 w-4" aria-hidden="true" />
              </div>
              <div className="flex flex-col gap-0.5 overflow-hidden leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate text-sm font-semibold text-sidebar-foreground">
                  {t("contractManager")}
                </span>
                <span className="truncate text-xs text-sidebar-foreground/70">
                  {t("universalService")}
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">{t("workspace")}</SidebarGroupLabel>
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
        <SidebarMenu>
          <SidebarMenuItem className="px-2 pb-2 group-data-[collapsible=icon]:hidden">
            <div className="flex items-center justify-between gap-2 rounded-md border bg-muted/50 p-1">
              <span className="pl-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                {language === "en" ? "Language" : "Lingua"}
              </span>
              <ToggleGroup
                type="single"
                value={language}
                onValueChange={(val) => val && setLanguage(val as "en" | "it")}
                className="h-7 gap-0"
              >
                <ToggleGroupItem value="en" className="h-6 px-2 text-[10px] data-[state=on]:bg-background">
                  EN
                </ToggleGroupItem>
                <ToggleGroupItem value="it" className="h-6 px-2 text-[10px] data-[state=on]:bg-background">
                  IT
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="pointer-events-none group-data-[collapsible=icon]:!p-0 group-data-[collapsible=icon]:justify-center">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#ffc8b2] text-[11px] font-semibold text-[#21264e]">
                {user.full_name
                  .split(" ")
                  .map((s) => s[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase()}
              </div>
              <div className="flex min-w-0 flex-col leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate text-sm font-medium text-sidebar-foreground">
                  {user.full_name}
                </span>
                <span className="truncate text-xs text-sidebar-foreground/70">
                  {user.role === "ADMIN" ? t("admin") : user.role === "MANAGER" ? t("manager") : t("agent")}
                  {user.branch ? ` · ${user.branch}` : ""}
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
