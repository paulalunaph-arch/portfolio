import "server-only"
import { cache } from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getSupabaseEnv } from "@/lib/supabase/env"

export const requireAdmin = cache(async function requireAdmin() {
  if (!getSupabaseEnv()) {
    redirect("/admin/login?error=config")
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.getClaims()

  if (error || !data?.claims?.sub) {
    redirect("/admin/login")
  }

  const userId = data.claims.sub
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", userId)
    .maybeSingle()

  if (profile?.role !== "admin") {
    redirect("/admin/login?error=sin-permiso")
  }

  return {
    supabase,
    userId,
    email: data.claims.email ?? null,
    fullName: profile.full_name ?? "",
  }
})

export async function getAdminSession() {
  if (!getSupabaseEnv()) {
    return null
  }

  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()

  if (!data?.claims?.sub) {
    return null
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.claims.sub)
    .maybeSingle()

  if (profile?.role !== "admin") {
    return { supabase, isAdmin: false as const }
  }

  return { supabase, isAdmin: true as const }
}
