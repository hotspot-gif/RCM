"use server"

import { revalidatePath } from "next/cache"
import { createClient as createPlainClient } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/server"
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/supabase/env"
import type { Role } from "@/lib/branches"
import { requireAdmin } from "@/lib/auth"

export type ActionResult = { ok: true } | { ok: false; error: string }

export async function createUserAction(input: {
  email: string
  password: string
  full_name: string
  role: Role
  branch: string | null
  zone: string | null
}): Promise<ActionResult> {
  try {
    await requireAdmin()

    // Use a standalone client so we do not overwrite the admin's session cookies
    // when calling signUp.
    const standalone = createPlainClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const { data: signUpData, error: signUpError } = await standalone.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        data: { full_name: input.full_name },
      },
    })

    if (signUpError) return { ok: false, error: signUpError.message }
    const newUserId = signUpData.user?.id
    if (!newUserId) {
      return {
        ok: false,
        error: "Account created but confirmation is pending. Ask the user to confirm their email, then sync.",
      }
    }

    const supabase = await createClient()
    const { error: insertError } = await supabase.from("users").upsert({
      id: newUserId,
      email: input.email,
      full_name: input.full_name,
      role: input.role,
      branch: input.branch,
      zone: input.zone,
      is_active: true,
    })

    if (insertError) return { ok: false, error: insertError.message }

    revalidatePath("/dashboard/users")
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unknown error" }
  }
}

export async function updateUserAction(
  id: string,
  patch: Partial<{
    full_name: string
    role: Role
    branch: string | null
    zone: string | null
    is_active: boolean
  }>,
): Promise<ActionResult> {
  try {
    await requireAdmin()
    const supabase = await createClient()
    const { error } = await supabase.from("users").update(patch).eq("id", id)
    if (error) return { ok: false, error: error.message }
    revalidatePath("/dashboard/users")
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unknown error" }
  }
}

export async function deleteUserAction(id: string): Promise<ActionResult> {
  try {
    const admin = await requireAdmin()
    if (admin.id === id) {
      return { ok: false, error: "You cannot delete your own account." }
    }
    const supabase = await createClient()
    const { error } = await supabase.from("users").delete().eq("id", id)
    if (error) return { ok: false, error: error.message }
    revalidatePath("/dashboard/users")
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unknown error" }
  }
}
