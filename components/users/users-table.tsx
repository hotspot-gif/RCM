"use client"

import { useState, useTransition } from "react"
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import type { AppUser } from "@/lib/types"
import { deleteUserAction } from "@/app/dashboard/users/actions"
import { EditUserDialog } from "./edit-user-dialog"

export function UsersTable({ users }: { users: AppUser[] }) {
  const [editing, setEditing] = useState<AppUser | null>(null)
  const [pending, startTransition] = useTransition()

  function onDelete(user: AppUser) {
    if (!confirm(`Delete ${user.full_name}? This cannot be undone.`)) return
    startTransition(async () => {
      const res = await deleteUserAction(user.id)
      if (!res.ok) toast.error(res.error)
      else toast.success("User deleted")
    })
  }

  if (users.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        No users yet. Create the first staff member to get started.
      </p>
    )
  }

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead>Zone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12" aria-label="Actions" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.full_name}</TableCell>
                <TableCell className="text-muted-foreground">{u.email}</TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={
                      u.role === "ADMIN"
                        ? "bg-[#245bc1] text-white hover:bg-[#245bc1]"
                        : u.role === "RSM"
                          ? "bg-[#21264e] text-white hover:bg-[#21264e]"
                        : u.role === "ASM"
                          ? "bg-[#ffc8b2] text-[#21264e] hover:bg-[#ffc8b2]"
                          : "bg-muted"
                    }
                  >
                    {u.role}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {u.role === "RSM"
                    ? (u.branches && u.branches.length > 0 ? u.branches.join(", ") : "—")
                    : (u.branch ?? "—")}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {u.zone ?? "—"}
                </TableCell>
                <TableCell>
                  {u.is_active ? (
                    <Badge className="bg-[#08dc7d] text-[#21264e] hover:bg-[#08dc7d]">
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="outline">Inactive</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" aria-label="Row actions">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditing(u)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        disabled={pending}
                        onClick={() => onDelete(u)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <EditUserDialog
        user={editing}
        open={!!editing}
        onOpenChange={(open) => !open && setEditing(null)}
      />
    </>
  )
}
