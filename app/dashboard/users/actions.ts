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
  branches?: string[] | null
  zone: string | null
}): Promise<ActionResult> {
  try {
    await requireAdmin()
    const normalizedBranches = (input.branches ?? []).filter(Boolean)
    if (input.role === "RSM" && normalizedBranches.length === 0) {
      return { ok: false, error: "RSM must have at least one branch." }
    }

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
      branch: input.role === "ASM" || input.role === "FSE" ? input.branch : null,
      branches: input.role === "RSM" ? normalizedBranches : null,
      zone: input.role === "FSE" ? input.zone : null,
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
    branches: string[] | null
    zone: string | null
    is_active: boolean
  }>,
): Promise<ActionResult> {
  try {
    await requireAdmin()
    const normalizedBranches = (patch.branches ?? []).filter(Boolean)
    if (patch.role === "RSM" && normalizedBranches.length === 0) {
      return { ok: false, error: "RSM must have at least one branch." }
    }
    const normalizedPatch: typeof patch = {
      ...patch,
      branch: patch.role === "ASM" || patch.role === "FSE" ? (patch.branch ?? null) : null,
      branches: patch.role === "RSM" ? normalizedBranches : null,
      zone: patch.role === "FSE" ? (patch.zone ?? null) : null,
    }
    const supabase = await createClient()
    const { error } = await supabase.from("users").update(normalizedPatch).eq("id", id)
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

export async function resetUserPasswordAction(input: {
  id: string
  password: string
}): Promise<ActionResult> {
  try {
    await requireAdmin()
    if (input.password.length < 6) {
      return { ok: false, error: "Password must be at least 6 characters long." }
    }

    const serviceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ??
      process.env.SUPABASE_SERVICE_ROLE ??
      ""

    if (!serviceRoleKey) {
      return {
        ok: false,
        error: "Missing SUPABASE_SERVICE_ROLE_KEY on the server. Add it to your environment to enable admin password resets.",
      }
    }

    const adminClient = createPlainClient(SUPABASE_URL, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const { error } = await adminClient.auth.admin.updateUserById(input.id, {
      password: input.password,
    })

    if (error) return { ok: false, error: error.message }
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unknown error" }
  }
}
