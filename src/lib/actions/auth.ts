"use server"

import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getSiteUrl, getSupabaseEnv } from "@/lib/supabase/env"
import type { ActionState } from "@/types/content"

function safeNext(value: FormDataEntryValue | null) {
  const next = String(value ?? "")

  if (!next.startsWith("/admin") || next.startsWith("//") || next.includes("\\")) {
    return "/admin/dashboard"
  }

  if (next.startsWith("/admin/login") || next.startsWith("/admin/recuperar")) {
    return "/admin/dashboard"
  }

  return next
}

export async function login(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!getSupabaseEnv()) {
    return { error: "Faltan las variables de Supabase en el servidor." }
  }

  const email = String(formData.get("email") ?? "").trim().toLowerCase()
  const password = String(formData.get("password") ?? "")

  if (!email || !password) {
    return { error: "Ingresá el correo y la contraseña." }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: "El correo o la contraseña no son correctos." }
  }

  const { data } = await supabase.auth.getClaims()
  const userId = data?.claims?.sub

  if (!userId) {
    return { error: "No se pudo iniciar la sesión." }
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle()

  if (profile?.role !== "admin") {
    await supabase.auth.signOut()
    return {
      error: "Esta cuenta no tiene acceso al estudio. Hay que autorizarla desde Supabase.",
    }
  }

  redirect(safeNext(formData.get("next")))
}

export async function logout() {
  if (getSupabaseEnv()) {
    const supabase = await createClient()
    await supabase.auth.signOut()
  }

  redirect("/admin/login")
}

export async function requestPasswordReset(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!getSupabaseEnv()) {
    return { error: "Faltan las variables de Supabase en el servidor." }
  }

  const email = String(formData.get("email") ?? "").trim().toLowerCase()

  if (!email) {
    return { error: "Ingresá el correo de la cuenta." }
  }

  const headerList = await headers()
  const origin = headerList.get("origin") || getSiteUrl()

  if (!origin) {
    return { error: "Definí NEXT_PUBLIC_SITE_URL para enviar el correo de recuperación." }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/admin/actualizar-contrasena`,
  })

  if (error) {
    return { error: "No se pudo enviar el correo. Revisá la configuración de Auth." }
  }

  return { ok: "Si el correo está registrado, vas a recibir un enlace para elegir una contraseña nueva." }
}

export async function updatePassword(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!getSupabaseEnv()) {
    return { error: "Faltan las variables de Supabase en el servidor." }
  }

  const password = String(formData.get("password") ?? "")
  const confirmation = String(formData.get("confirmation") ?? "")

  if (password.length < 8) {
    return { error: "La contraseña tiene que tener al menos 8 caracteres." }
  }

  if (password !== confirmation) {
    return { error: "Las contraseñas no coinciden." }
  }

  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()

  if (!data?.claims?.sub) {
    return { error: "El enlace venció. Pedí uno nuevo." }
  }

  const { error } = await supabase.auth.updateUser({ password })

  if (error) {
    return { error: "No se pudo actualizar la contraseña." }
  }

  redirect("/admin/dashboard")
}
