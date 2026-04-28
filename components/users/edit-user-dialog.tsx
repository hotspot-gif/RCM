"use client"

import { useEffect, useState, useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { UserFormFields } from "./user-form-fields"
import { sendUserPasswordResetEmailAction, updateUserAction } from "@/app/dashboard/users/actions"
import type { AppUser } from "@/lib/types"

export function EditUserDialog({
  user,
  open,
  onOpenChange,
}: {
  user: AppUser | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [values, setValues] = useState({
    full_name: "",
    email: "",
    role: "FSE" as AppUser["role"],
    branch: null as string | null,
    branches: null as string[] | null,
    zone: null as string | null,
    is_active: true,
  })
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    if (user) {
      setValues({
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        branch: user.branch,
        branches: user.branches ?? null,
        zone: user.zone,
        is_active: user.is_active,
      })
    }
  }, [user])

  if (!user) return null

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    startTransition(async () => {
      if (values.role === "RSM" && (!values.branches || values.branches.length === 0)) {
        toast.error("Select at least one branch for RSM.")
        return
      }
      const res = await updateUserAction(user.id, {
        full_name: values.full_name,
        role: values.role,
        branch: values.branch,
        branches: values.branches,
        zone: values.zone,
        is_active: values.is_active,
      })
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      toast.success("User updated")
      onOpenChange(false)
    })
  }

  function sendPasswordResetEmail() {
    if (!user) return
    startTransition(async () => {
      const res = await sendUserPasswordResetEmailAction({ email: user.email })
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      toast.success("Password reset email sent")
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit user</DialogTitle>
          <DialogDescription>
            Update role, territory and activation status.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit}>
          <UserFormFields
            values={values}
            onChange={(p) => setValues((v) => ({ ...v, ...p }))}
            emailDisabled
          />

          <div className="mt-4 flex items-center justify-between rounded-lg border p-3">
            <div className="flex flex-col">
              <Label htmlFor="is_active" className="text-sm font-medium">
                Active
              </Label>
              <span className="text-xs text-muted-foreground">
                Inactive users cannot sign in.
              </span>
            </div>
            <Switch
              id="is_active"
              checked={values.is_active}
              onCheckedChange={(v) => setValues((prev) => ({ ...prev, is_active: v }))}
            />
          </div>

          <div className="mt-4 flex items-center justify-between rounded-lg border p-3">
            <div className="flex flex-col">
              <Label className="text-sm font-medium">Reset password</Label>
              <span className="text-xs text-muted-foreground">
                Sends a password reset email to the user.
              </span>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={sendPasswordResetEmail}
              disabled={pending}
            >
              {pending ? <Spinner className="mr-2 h-4 w-4" /> : null}
              Send reset email
            </Button>
          </div>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? <Spinner className="mr-2 h-4 w-4" /> : null}
              Save changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
