import type { MetadataRoute } from "next"
import { connection } from "next/server"
import { getRequestOrigin } from "@/lib/request-origin"

export default async function robots(): Promise<MetadataRoute.Robots> {
  await connection()
  const site = await getRequestOrigin()

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/auth"],
    },
    ...(site ? { sitemap: `${site}/sitemap.xml` } : {}),
  }
}
