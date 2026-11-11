import "server-only"
import { cacheLife, cacheTag } from "next/cache"
import { createPublicClient } from "@/lib/supabase/public"
import {
  emptySettings,
  type GalleryPhoto,
  type PublishedSeries,
  type SeriesSummary,
  type SiteSettings,
  type SocialLink,
} from "@/types/content"

type SettingsRow = {
  photographer_name: string
  profession: string
  biography: string
  education: string
  interests: string
  author_statement: string
  portrait_url: string | null
  portrait_storage_path: string | null
  portrait_alt: string
  portrait_width: number | null
  portrait_height: number | null
  portrait_file_size_bytes: number | null
  featured_image_url: string | null
  featured_image_storage_path: string | null
  featured_image_alt: string
  featured_width: number | null
  featured_height: number | null
  featured_file_size_bytes: number | null
  email: string
  instagram: string
  social_links: unknown
  seo_title: string
  seo_description: string
  color_background?: string | null
  color_text?: string | null
  color_muted?: string | null
  color_line?: string | null
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

function mapSettings(row: SettingsRow): SiteSettings {
  return {
    photographerName: row.photographer_name ?? "",
    profession: row.profession ?? emptySettings.profession,
    biography: row.biography ?? "",
    education: row.education ?? "",
    interests: row.interests ?? "",
    authorStatement: row.author_statement ?? "",
    portraitUrl: row.portrait_url,
    portraitStoragePath: row.portrait_storage_path,
    portraitAlt: row.portrait_alt ?? "",
    portraitWidth: row.portrait_width,
    portraitHeight: row.portrait_height,
    portraitBytes: row.portrait_file_size_bytes,
    featuredImageUrl: row.featured_image_url,
    featuredImageStoragePath: row.featured_image_storage_path,
    featuredImageAlt: row.featured_image_alt ?? "",
    featuredWidth: row.featured_width,
    featuredHeight: row.featured_height,
    featuredBytes: row.featured_file_size_bytes,
    email: row.email ?? "",
    instagram: row.instagram ?? "",
    socialLinks: asLinks(row.social_links),
    seoTitle: row.seo_title ?? "",
    seoDescription: row.seo_description ?? "",
    colorBackground: hexOr(row.color_background, emptySettings.colorBackground),
    colorText: hexOr(row.color_text, emptySettings.colorText),
    colorMuted: hexOr(row.color_muted, emptySettings.colorMuted),
    colorLine: hexOr(row.color_line, emptySettings.colorLine),
  }
}

function hexOr(value: string | null | undefined, fallback: string) {
  return value && /^#[0-9a-fA-F]{6}$/.test(value) ? value.toLowerCase() : fallback
}

export async function getSiteSettings() {
  "use cache"
  cacheLife("hours")
  cacheTag("settings")

  const supabase = createPublicClient()

  if (!supabase) {
    return emptySettings
  }

  const { data, error } = await supabase.from("site_settings").select("*").limit(1).maybeSingle()

  if (error || !data) {
    return emptySettings
  }

  return mapSettings(data as SettingsRow)
}

type CoverJoin = {
  width: number | null
  height: number | null
  alt_text: string | null
} | null

type SeriesListRow = {
  id: string
  title: string
  slug: string
  description: string | null
  year: number | null
  location: string | null
  cover_image_url: string | null
  cover: CoverJoin | CoverJoin[]
}

function oneCover(cover: SeriesListRow["cover"]): CoverJoin {
  if (Array.isArray(cover)) {
    return cover[0] ?? null
  }

  return cover
}

type HomeSeries = { slug: string; title: string } | { slug: string; title: string }[] | null

type HomeRow = {
  id: string
  image_url: string | null
  caption: string | null
  alt_text: string | null
  location: string | null
  taken_at: string | null
  width: number | null
  height: number | null
  series: HomeSeries
}

function oneSeries(series: HomeSeries) {
  if (Array.isArray(series)) {
    return series[0] ?? null
  }

  return series
}

export async function getHomeSelection(): Promise<GalleryPhoto[]> {
  "use cache"
  cacheLife("hours")
  cacheTag("home", "series")

  const supabase = createPublicClient()

  if (!supabase) {
    return []
  }

  const { data, error } = await supabase
    .from("photographs")
    .select(
      "id, image_url, caption, alt_text, location, taken_at, width, height, series!photographs_series_id_fkey!inner(title, slug, published)",
    )
    .eq("published", true)
    .eq("home_selected", true)
    .eq("series.published", true)
    .order("home_sort_order", { ascending: true })
    .order("sort_order", { ascending: true })

  if (error || !data) {
    return []
  }

  const photos = (data as HomeRow[]).flatMap((row) => {
    const series = oneSeries(row.series)

    if (!row.image_url || !row.width || !row.height || !series) {
      return []
    }

    return [
      {
        id: row.id,
        src: row.image_url,
        width: row.width,
        height: row.height,
        alt: row.alt_text || row.caption || `Fotografía de ${series.title}`,
        caption: row.caption,
        location: row.location,
        takenAt: row.taken_at,
        seriesSlug: series.slug,
        seriesTitle: series.title,
      },
    ]
  })

  return photos
}

export async function getPublishedSeries(): Promise<SeriesSummary[]> {
  "use cache"
  cacheLife("hours")
  cacheTag("series")

  const supabase = createPublicClient()

  if (!supabase) {
    return []
  }

  const { data, error } = await supabase
    .from("series")
    .select(
      "id, title, slug, description, year, location, cover_image_url, cover:photographs!series_cover_photograph_id_fkey(width, height, alt_text)",
    )
    .eq("published", true)
    .order("sort_order", { ascending: true })
    .order("title", { ascending: true })

  if (error || !data) {
    return []
  }

  return (data as SeriesListRow[]).map((row) => {
    const cover = oneCover(row.cover)

    return {
      id: row.id,
      title: row.title,
      slug: row.slug,
      description: row.description,
      year: row.year,
      location: row.location,
      coverUrl: row.cover_image_url,
      coverWidth: cover?.width ?? null,
      coverHeight: cover?.height ?? null,
      coverAlt: cover?.alt_text || row.title,
    }
  })
}

type PhotoRow = {
  id: string
  image_url: string | null
  caption: string | null
  alt_text: string | null
  location: string | null
  taken_at: string | null
  width: number | null
  height: number | null
  sort_order: number
}

export async function getPublishedSeriesBySlug(slug: string): Promise<PublishedSeries | null> {
  "use cache"
  cacheLife("hours")
  cacheTag("series", `series:${slug}`)

  const supabase = createPublicClient()

  if (!supabase) {
    return null
  }

  const { data, error } = await supabase
    .from("series")
    .select(
      "id, title, slug, description, year, location, cover_image_url, photographs!photographs_series_id_fkey(id, image_url, caption, alt_text, location, taken_at, width, height, sort_order)",
    )
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle()

  if (error || !data) {
    return null
  }

  const row = data as SeriesListRow & { photographs: PhotoRow[] | null }
  const photos: GalleryPhoto[] = (row.photographs ?? [])
    .filter((photo) => photo.image_url && photo.width && photo.height)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((photo) => ({
      id: photo.id,
      src: photo.image_url as string,
      width: photo.width as number,
      height: photo.height as number,
      alt: photo.alt_text || photo.caption || `Fotografía de ${row.title}`,
      caption: photo.caption,
      location: photo.location,
      takenAt: photo.taken_at,
    }))

  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description,
    year: row.year,
    location: row.location,
    coverUrl: row.cover_image_url,
    coverWidth: null,
    coverHeight: null,
    coverAlt: row.title,
    photos,
  }
}
