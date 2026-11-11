import "server-only"
import type { SupabaseClient } from "@supabase/supabase-js"
import { emptySettings, type AdminPhotograph, type AdminSeries, type DashboardData, type SiteSettings, type SocialLink } from "@/types/content"

type SeriesRow = {
  id: string
  title: string
  slug: string
  description: string | null
  year: number | null
  location: string | null
  cover_image_url: string | null
  cover_photograph_id: string | null
  published: boolean
  sort_order: number
  updated_at: string
  photographs?: Array<{ count: number }>
}

function mapSeries(row: SeriesRow): AdminSeries {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description ?? "",
    year: row.year,
    location: row.location ?? "",
    coverImageUrl: row.cover_image_url,
    coverPhotographId: row.cover_photograph_id,
    published: row.published,
    sortOrder: row.sort_order,
    updatedAt: row.updated_at,
    photographCount: row.photographs?.[0]?.count ?? 0,
  }
}

function asLinks(value: unknown): SocialLink[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.flatMap((item) => {
    if (!item || typeof item !== "object") {
      return []
    }

    const label = "label" in item ? String(item.label ?? "") : ""
    const url = "url" in item ? String(item.url ?? "") : ""

    if (!label || !url) {
      return []
    }

    return [{ label, url }]
  })
}

export async function getAdminSettings(supabase: SupabaseClient): Promise<SiteSettings> {
  const { data, error } = await supabase.from("site_settings").select("*").limit(1).maybeSingle()

  if (error || !data) {
    throw new Error("No se pudo leer la configuración del sitio.")
  }

  return {
    photographerName: data.photographer_name ?? "",
    profession: data.profession ?? "",
    biography: data.biography ?? "",
    education: data.education ?? "",
    interests: data.interests ?? "",
    authorStatement: data.author_statement ?? "",
    portraitUrl: data.portrait_url,
    portraitStoragePath: data.portrait_storage_path,
    portraitAlt: data.portrait_alt ?? "",
    portraitWidth: data.portrait_width,
    portraitHeight: data.portrait_height,
    portraitBytes: data.portrait_file_size_bytes,
    featuredImageUrl: data.featured_image_url,
    featuredImageStoragePath: data.featured_image_storage_path,
    featuredImageAlt: data.featured_image_alt ?? "",
    featuredWidth: data.featured_width,
    featuredHeight: data.featured_height,
    featuredBytes: data.featured_file_size_bytes,
    email: data.email ?? "",
    instagram: data.instagram ?? "",
    socialLinks: asLinks(data.social_links),
    seoTitle: data.seo_title ?? "",
    seoDescription: data.seo_description ?? "",
    colorBackground: hexOr(data.color_background, emptySettings.colorBackground),
    colorText: hexOr(data.color_text, emptySettings.colorText),
    colorMuted: hexOr(data.color_muted, emptySettings.colorMuted),
    colorLine: hexOr(data.color_line, emptySettings.colorLine),
  }
}

function hexOr(value: unknown, fallback: string) {
  return typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value) ? value.toLowerCase() : fallback
}

export async function getDashboard(supabase: SupabaseClient): Promise<DashboardData> {
  const [total, published, photographs, storage, recent] = await Promise.all([
    supabase.from("series").select("id", { count: "exact", head: true }),
    supabase.from("series").select("id", { count: "exact", head: true }).eq("published", true),
    supabase.from("photographs").select("id", { count: "exact", head: true }),
    supabase.rpc("portfolio_storage_bytes"),
    supabase
      .from("series")
      .select("id, title, published, updated_at")
      .order("updated_at", { ascending: false })
      .limit(6),
  ])

  const totalSeries = total.count ?? 0
  const publishedSeries = published.count ?? 0

  return {
    totalSeries,
    publishedSeries,
    draftSeries: Math.max(0, totalSeries - publishedSeries),
    totalPhotographs: photographs.count ?? 0,
    storageBytes: typeof storage.data === "number" ? storage.data : null,
    recent: (recent.data ?? []).map((item) => ({
      id: item.id as string,
      title: item.title as string,
      published: item.published as boolean,
      updatedAt: item.updated_at as string,
    })),
  }
}

export async function listAdminSeries(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("series")
    .select(
      "id, title, slug, description, year, location, cover_image_url, cover_photograph_id, published, sort_order, updated_at, photographs!photographs_series_id_fkey(count)",
    )
    .order("sort_order", { ascending: true })
    .order("title", { ascending: true })

  if (error || !data) {
    throw new Error("No se pudieron leer las categorías.")
  }

  return (data as SeriesRow[]).map(mapSeries)
}

export async function getAdminSeries(supabase: SupabaseClient, id: string) {
  const { data, error } = await supabase
    .from("series")
    .select(
      "id, title, slug, description, year, location, cover_image_url, cover_photograph_id, published, sort_order, updated_at, photographs!photographs_series_id_fkey(count)",
    )
    .eq("id", id)
    .maybeSingle()

  if (error) {
    throw new Error("No se pudo leer la categoría.")
  }

  if (!data) {
    return null
  }

  return mapSeries(data as SeriesRow)
}

async function displayUrl(
  supabase: SupabaseClient,
  bucket: "portfolio" | "library",
  path: string,
  imageUrl: string | null,
) {
  if (bucket === "portfolio" && imageUrl) {
    return imageUrl
  }

  const { data } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 60)
  return data?.signedUrl ?? null
}

export async function listAdminPhotographs(supabase: SupabaseClient, seriesId: string) {
  const { data, error } = await supabase
    .from("photographs")
    .select(
      "id, image_url, storage_path, storage_bucket, caption, alt_text, location, taken_at, sort_order, home_selected, published, width, height, file_size_bytes, original_file_size_bytes",
    )
    .eq("series_id", seriesId)
    .order("sort_order", { ascending: true })

  if (error || !data) {
    return []
  }

  const photos: AdminPhotograph[] = []

  for (const row of data) {
    const bucket = row.storage_bucket === "portfolio" ? "portfolio" : "library"
    photos.push({
      id: row.id,
      imageUrl: row.image_url,
      displayUrl: await displayUrl(supabase, bucket, row.storage_path, row.image_url),
      storagePath: row.storage_path,
      storageBucket: bucket,
      caption: row.caption ?? "",
      altText: row.alt_text ?? "",
      location: row.location ?? "",
      takenAt: row.taken_at ?? "",
      sortOrder: row.sort_order,
      homeSelected: Boolean(row.home_selected),
      published: row.published,
      width: row.width,
      height: row.height,
      fileSizeBytes: row.file_size_bytes,
      originalFileSizeBytes: row.original_file_size_bytes,
    })
  }

  return photos
}
