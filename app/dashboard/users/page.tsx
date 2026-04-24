import { requireAdmin } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { UsersTable } from "@/components/users/users-table"
import { NewUserDialog } from "@/components/users/new-user-dialog"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { AppUser } from "@/lib/types"

export default async function UsersPage() {
  await requireAdmin()
  const supabase = await createClient()

  const { data } = await supabase
    .from("users")
    .select("*")
    .order("created_at", { ascending: false })

  const users = (data ?? []) as AppUser[]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
          <p className="text-sm text-muted-foreground">
            Manage staff accounts, roles and territory assignments.
          </p>
        </div>
        <NewUserDialog />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All users</CardTitle>
          <CardDescription>
            {users.length} {users.length === 1 ? "user" : "users"} in the system.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UsersTable users={users} />
        </CardContent>
      </Card>
    </div>
  )
}
