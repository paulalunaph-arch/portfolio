import { createBrowserClient } from "@supabase/ssr"
import { getSupabaseEnv } from "@/lib/supabase/env"

export function createClient() {
  const env = getSupabaseEnv()

  if (!env) {
    throw new Error("Supabase no está configurado.")
  }

  return createBrowserClient(env.url, env.key)
}
