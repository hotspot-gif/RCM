"use client"

import { useState, useTransition } from "react"
import { MoreHorizontal, Pencil, Trash2, Mail, Shield, MapPin, CheckCircle2, XCircle } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import type { AppUser } from "@/lib/types"
import { deleteUserAction } from "@/app/dashboard/users/actions"
import { EditUserDialog } from "./edit-user-dialog"

export function UsersTable({ users }: { users: AppUser[] }) {
  const [editing, setEditing] = useState<AppUser | null>(null)
  const [pending, startTransition] = useTransition()

  function onDelete(user: AppUser) {
    if (!confirm(`Are you sure you want to delete ${user.full_name}? This action cannot be undone.`)) return
    startTransition(async () => {
      const res = await deleteUserAction(user.id)
      if (!res.ok) toast.error(res.error)
      else toast.success("User deleted successfully")
    })
  }

  function getInitials(name: string) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <div className="bg-muted/30 p-4 rounded-full mb-4">
          <Mail className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="text-lg font-medium text-brand-navy">No staff members found</p>
        <p className="text-sm text-muted-foreground mt-1">
          Start by adding a new user to the system.
        </p>
      </div>
    )
  }

  return (
    <>
      <Table>
        <TableHeader className="bg-muted/30">
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[300px] font-semibold text-brand-navy">Staff Member</TableHead>
            <TableHead className="font-semibold text-brand-navy">Role & Access</TableHead>
            <TableHead className="font-semibold text-brand-navy">Assignments</TableHead>
            <TableHead className="font-semibold text-brand-navy">Account Status</TableHead>
            <TableHead className="w-[100px] text-right font-semibold text-brand-navy pr-6">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((u) => (
            <TableRow key={u.id} className="group hover:bg-brand-navy/[0.02] transition-colors">
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border-2 border-white shadow-sm ring-1 ring-brand-navy/10">
                    <AvatarFallback className="bg-brand-navy text-white text-xs font-bold">
                      {getInitials(u.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="font-bold text-brand-navy leading-none mb-1">{u.full_name}</span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Mail className="h-3 w-3" /> {u.email}
                    </span>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-1.5 items-start">
                  <Badge
                    variant="secondary"
                    className={
                      u.role === "ADMIN"
                        ? "bg-blue-600 text-white hover:bg-blue-700 px-2 py-0 border-none"
                        : u.role === "RSM"
                          ? "bg-brand-navy text-white hover:bg-brand-navy/90 px-2 py-0 border-none"
                        : u.role === "ASM"
                          ? "bg-orange-100 text-orange-700 hover:bg-orange-200 px-2 py-0 border-none font-semibold"
                          : "bg-muted text-muted-foreground px-2 py-0 border-none"
                    }
                  >
                    <Shield className="h-3 w-3 mr-1" />
                    {u.role}
                  </Badge>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-sm text-brand-navy font-medium">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                    {u.role === "RSM"
                      ? (u.branches && u.branches.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {u.branches.map(b => (
                              <span key={b} className="bg-brand-navy/5 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold border border-brand-navy/10">
                                {b}
                              </span>
                            ))}
                          </div>
                        ) : "Unassigned")
                      : (u.branch ?? "Unassigned")}
                  </div>
                  {u.zone && (
                    <span className="text-[10px] uppercase font-bold text-muted-foreground ml-5">
                      Zone: {u.zone}
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                {u.is_active ? (
                  <div className="flex items-center gap-1.5 text-emerald-600 font-semibold text-sm">
                    <CheckCircle2 className="h-4 w-4" />
                    Active
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-muted-foreground font-medium text-sm">
                    <XCircle className="h-4 w-4" />
                    Disabled
                  </div>
                )}
              </TableCell>
              <TableCell className="text-right pr-6">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-brand-navy/10">
                      <MoreHorizontal className="h-4 w-4 text-brand-navy" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel className="text-xs text-muted-foreground font-semibold px-2 py-1.5 uppercase tracking-wider">Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setEditing(u)} className="cursor-pointer">
                      <Pencil className="mr-2 h-4 w-4" />
                      Modify Account
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      disabled={pending}
                      onClick={() => onDelete(u)}
                      className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Remove User
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <EditUserDialog
        user={editing}
        open={!!editing}
        onOpenChange={(open) => !open && setEditing(null)}
      />
    </>
  )
}
