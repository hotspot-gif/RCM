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
import { Badge } from "@/components/ui/badge"
import { Check, Copy, Key, Mail, Pencil, Shield } from "lucide-react"
import { UserFormFields } from "./user-form-fields"
import {
  resetUserPasswordToTemporaryAction,
  sendUserPasswordResetEmailAction,
  updateUserAction,
} from "@/app/dashboard/users/actions"
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
  const [tempPassword, setTempPassword] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (user) {
      setTempPassword(null)
      setCopied(false)
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

  function resetToTempPassword() {
    if (!user) return
    startTransition(async () => {
      const res = await resetUserPasswordToTemporaryAction(user.id)
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      setTempPassword(res.data)
      toast.success("Password has been reset")
    })
  }

  function copyToClipboard() {
    if (!tempPassword) return
    navigator.clipboard.writeText(tempPassword)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success("Password copied to clipboard")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle className="text-2xl font-bold text-brand-navy flex items-center gap-2">
            <Pencil className="h-5 w-5 text-brand-navy" />
            Edit Staff Member
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Update roles, regional assignments, and account security for <strong>{user.full_name}</strong>.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="px-6 pb-6 space-y-6">
          <div className="bg-brand-navy/[0.02] p-4 rounded-xl border border-brand-navy/10 space-y-4">
            <h3 className="text-xs font-bold text-brand-navy uppercase tracking-widest mb-2 flex items-center gap-2">
              <Shield className="h-3 w-3" />
              Profile & Access
            </h3>
            <UserFormFields
              values={values}
              onChange={(p) => setValues((v) => ({ ...v, ...p }))}
              emailDisabled
            />

            <div className="flex items-center justify-between rounded-lg bg-white border p-4 shadow-sm mt-4">
              <div className="flex flex-col">
                <Label htmlFor="is_active" className="text-sm font-bold text-brand-navy">
                  Account Access
                </Label>
                <span className="text-xs text-muted-foreground">
                  {values.is_active ? "User can currently sign in." : "User is currently locked out."}
                </span>
              </div>
              <Switch
                id="is_active"
                checked={values.is_active}
                onCheckedChange={(v) => setValues((prev) => ({ ...prev, is_active: v }))}
                className="data-[state=checked]:bg-emerald-500"
              />
            </div>
          </div>

          <div className="flex flex-col gap-4 rounded-xl border p-4 bg-muted/30 shadow-sm border-brand-navy/10">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <h3 className="text-xs font-bold text-brand-navy uppercase tracking-widest mb-1 flex items-center gap-2">
                  <Key className="h-3 w-3" />
                  Security Controls
                </h3>
                <span className="text-[10px] text-muted-foreground">
                  Reset user password if they are unable to sign in.
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={sendPasswordResetEmail}
                  disabled={pending}
                  className="h-8 border-brand-navy/20 hover:bg-brand-navy/5 text-brand-navy"
                >
                  {pending ? <Spinner className="mr-2 h-3 w-3" /> : <Mail className="mr-2 h-3 w-3" />}
                  Email Reset Link
                </Button>
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={resetToTempPassword}
                  disabled={pending}
                  className="h-8 bg-brand-navy hover:bg-brand-navy/90 shadow-md"
                >
                  {pending ? <Spinner className="mr-2 h-3 w-3" /> : <Key className="mr-2 h-3 w-3" />}
                  Set Temp Password
                </Button>
              </div>
            </div>

            {tempPassword && (
              <div className="flex flex-col gap-2 rounded-lg bg-white p-4 border-2 border-dashed border-brand-navy/30 animate-in zoom-in-95 duration-300 shadow-inner">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[10px] font-black text-brand-navy uppercase tracking-tighter opacity-50">New Temporary Password</p>
                  <Badge variant="outline" className="text-[9px] h-4 bg-emerald-50 text-emerald-700 border-emerald-200 uppercase font-black">Active Now</Badge>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <code className="flex-1 rounded-md bg-muted/50 px-3 py-2 text-xl font-mono font-black text-brand-navy tracking-widest border border-brand-navy/5">
                    {tempPassword}
                  </code>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={copyToClipboard}
                    className="h-10 w-10 shrink-0 border-brand-navy/20 hover:border-brand-navy hover:bg-brand-navy/5"
                  >
                    {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4 text-brand-navy" />}
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground italic leading-tight mt-1">
                  <strong>Important:</strong> Provide this password to the user. It works immediately and they should update it upon first login.
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="pt-2 border-t mt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={pending}
              className="text-muted-foreground"
            >
              Discard Changes
            </Button>
            <Button type="submit" disabled={pending} className="bg-brand-navy hover:bg-brand-navy/90 px-8 shadow-lg">
              {pending ? <Spinner className="mr-2 h-4 w-4" /> : null}
              Save All Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
