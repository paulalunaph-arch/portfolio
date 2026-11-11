import "server-only"
import { headers } from "next/headers"
import { getSiteUrl } from "@/lib/supabase/env"

export async function getRequestOrigin() {
  const configured = getSiteUrl()

  if (configured) {
    return configured
  }

  const headerList = await headers()
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host")

  if (!host) {
    return "http://localhost:3000"
  }

  const forwarded = headerList.get("x-forwarded-proto")
  const proto = forwarded || (host.includes("localhost") || host.startsWith("127.") ? "http" : "https")
  return `${proto}://${host}`
}
