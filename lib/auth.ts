import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import type { AppUser } from "@/lib/types"

/**
 * Require an authenticated user with a profile row in `public.users`.
 * Redirects to /auth/login if unauthenticated.
 * Returns null (and does not redirect) when user is authenticated but has
 * no profile row - caller should handle missing profile gracefully.
 */
export async function getCurrentUser(): Promise<AppUser | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .maybeSingle()

  if (error) {
    console.error("[v0] failed to load profile for", user.id, error)
    return null
  }
  if (!data) {
    console.warn("[v0] no profile row found for auth user", user.id)
    return null
  }
  return data as AppUser
}

export async function requireUser(): Promise<AppUser> {
  const profile = await getCurrentUser()
  if (!profile) {
    redirect("/auth/no-access")
  }
  return profile
}

export async function requireAdmin(): Promise<AppUser> {
  const user = await requireUser()
  if (user.role !== "ADMIN") {
    redirect("/dashboard")
  }
  return user
}
