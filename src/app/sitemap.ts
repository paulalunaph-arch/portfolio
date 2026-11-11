import type { MetadataRoute } from "next"
import { connection } from "next/server"
import { getPublishedSeries } from "@/lib/data/public"
import { getRequestOrigin } from "@/lib/request-origin"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connection()
  const series = await getPublishedSeries()
  const site = await getRequestOrigin()

  return [
    { url: site, changeFrequency: "weekly", priority: 1 },
    { url: `${site}/portfolio`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${site}/sobre-mi`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${site}/contacto`, changeFrequency: "monthly", priority: 0.5 },
    ...series.map((item) => ({
      url: `${site}/portfolio/${item.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ]
}
