"use client"

import { useEffect, useState, useTransition } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { Shield, Lock } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"

export default function ResetPasswordPage() {
  const [pending, startTransition] = useTransition()
  const [ready, setReady] = useState(false)
  const [hasSession, setHasSession] = useState<boolean>(false)
  const [formData, setFormData] = useState({ password: "", confirmPassword: "" })

  useEffect(() => {
    const initSession = async () => {
      const supabase = createClient()
      const { data: urlData, error: urlError } = await supabase.auth.getSessionFromUrl({ storeSession: true })
      if (urlError) {
        console.warn("Unable to parse Supabase reset session from URL:", urlError)
      }

      const session = urlData?.session ?? (await supabase.auth.getSession()).data.session
      setHasSession(!!session)
      setReady(true)
    }

    initSession()
  }, [])

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters long")
      return
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match")
      return
    }

    startTransition(async () => {
      try {
        const supabase = createClient()
        const { error } = await supabase.auth.updateUser({ password: formData.password })
        if (error) {
          const msg =
            typeof error?.message === "string" && error.message.trim().length > 0
              ? error.message
              : JSON.stringify(error, Object.getOwnPropertyNames(error)) || String(error)
          toast.error(msg || "Failed to update password")
          return
        }
        toast.success("Password updated successfully")
        setFormData({ password: "", confirmPassword: "" })
      } catch (err) {
        const msg =
          err instanceof Error
            ? err.message
            : typeof err === "string"
            ? err
            : JSON.stringify(err, Object.getOwnPropertyNames(err)) || String(err) || "Failed to update password"
        toast.error(msg)
      }
    })
  }

  if (!ready) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center py-10">
          <Spinner className="h-5 w-5" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardContent className="flex flex-col gap-4 pt-6">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#21264e] text-[#fff7f2]">
            <Shield className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-semibold">Reset password</h1>
            <p className="text-sm text-muted-foreground">
              Choose a new password for your account.
            </p>
          </div>
        </div>

        {!hasSession ? (
          <div className="rounded-lg border p-3 text-sm text-muted-foreground">
            This reset link is invalid or has expired. Request a new one from your administrator.
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData((p) => ({ ...p, password: e.target.value }))}
                placeholder="••••••••"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm new password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, confirmPassword: e.target.value }))
                }
                placeholder="••••••••"
                required
              />
            </div>
            <Button type="submit" disabled={pending} className="w-full">
              {pending ? <Spinner className="mr-2 h-4 w-4" /> : <Lock className="mr-2 h-4 w-4" />}
              Update password
            </Button>
          </form>
        )}

        <Button variant="outline" asChild>
          <Link href="/auth/login">Back to sign in</Link>
        </Button>
      </CardContent>
    </Card>
  )
}

