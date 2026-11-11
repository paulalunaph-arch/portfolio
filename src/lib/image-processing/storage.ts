import "server-only"
import type { SupabaseClient } from "@supabase/supabase-js"

export type ImageBucket = "portfolio" | "library" | "incoming"

export async function downloadObject(
  supabase: SupabaseClient,
  bucket: ImageBucket,
  path: string,
) {
  const { data, error } = await supabase.storage.from(bucket).download(path)

  if (error || !data) {
    throw new Error("No se encontró el archivo temporal para procesar.")
  }

  return Buffer.from(await data.arrayBuffer())
}

export async function uploadOptimized(
  supabase: SupabaseClient,
  bucket: "portfolio" | "library",
  path: string,
  buffer: Buffer,
) {
  const { error } = await supabase.storage.from(bucket).upload(path, buffer, {
    contentType: "image/webp",
    cacheControl: "31536000",
    upsert: false,
  })

  if (error) {
    throw new Error("No se pudo guardar la imagen optimizada.")
  }
}

export function publicObjectUrl(supabase: SupabaseClient, path: string) {
  return supabase.storage.from("portfolio").getPublicUrl(path).data.publicUrl
}

export async function removeObject(
  supabase: SupabaseClient,
  bucket: ImageBucket,
  path: string,
) {
  const { error } = await supabase.storage.from(bucket).remove([path])

  if (error && !/not found|does not exist/i.test(error.message)) {
    throw new Error("No se pudo eliminar el archivo del almacenamiento.")
  }
}

export async function relocateOptimized(
  supabase: SupabaseClient,
  from: "portfolio" | "library",
  to: "portfolio" | "library",
  path: string,
) {
  if (from === to) {
    return {
      bucket: to,
      publicUrl: to === "portfolio" ? publicObjectUrl(supabase, path) : null,
    }
  }

  const buffer = await downloadObject(supabase, from, path)
  const { error } = await supabase.storage.from(to).upload(path, buffer, {
    contentType: "image/webp",
    cacheControl: "31536000",
    upsert: true,
  })

  if (error) {
    throw new Error("No se pudo cambiar la visibilidad de la imagen.")
  }

  await removeObject(supabase, from, path)

  return {
    bucket: to,
    publicUrl: to === "portfolio" ? publicObjectUrl(supabase, path) : null,
  }
}

async function pathIsReferenced(
  supabase: SupabaseClient,
  bucket: "portfolio" | "library",
  path: string,
) {
  const [{ count }, settingsResult] = await Promise.all([
    supabase
      .from("photographs")
      .select("id", { count: "exact", head: true })
      .eq("storage_bucket", bucket)
      .eq("storage_path", path),
    supabase
      .from("site_settings")
      .select("portrait_storage_path, featured_image_storage_path")
      .limit(1)
      .maybeSingle(),
  ])

  const settings = settingsResult.data
  const usedBySettings =
    bucket === "portfolio" &&
    (settings?.portrait_storage_path === path || settings?.featured_image_storage_path === path)

  return (count ?? 0) > 0 || usedBySettings
}

export async function removeIfUnreferenced(
  supabase: SupabaseClient,
  bucket: "portfolio" | "library",
  path: string | null,
) {
  if (!path) {
    return
  }

  const referenced = await pathIsReferenced(supabase, bucket, path)

  if (!referenced) {
    await removeObject(supabase, bucket, path)
  }
}

type PhotoVisibilityRow = {
  id: string
  published: boolean
  storage_bucket: "portfolio" | "library"
  storage_path: string
  image_url: string | null
}

export async function syncSeriesVisibility(supabase: SupabaseClient, seriesId: string) {
  const { data: series, error } = await supabase
    .from("series")
    .select("id, published, cover_photograph_id")
    .eq("id", seriesId)
    .single()

  if (error || !series) {
    throw new Error("No se encontró la categoría.")
  }

  const { data: photos, error: photosError } = await supabase
    .from("photographs")
    .select("id, published, storage_bucket, storage_path, image_url")
    .eq("series_id", seriesId)

  if (photosError) {
    throw new Error("No se pudieron leer las fotografías de la categoría.")
  }

  for (const photo of (photos ?? []) as PhotoVisibilityRow[]) {
    const shouldBePublic = Boolean(series.published && photo.published)
    const target = shouldBePublic ? "portfolio" : "library"
    let nextUrl = shouldBePublic ? publicObjectUrl(supabase, photo.storage_path) : null
    let nextBucket = photo.storage_bucket

    if (photo.storage_bucket !== target) {
      const moved = await relocateOptimized(
        supabase,
        photo.storage_bucket,
        target,
        photo.storage_path,
      )
      nextBucket = moved.bucket
      nextUrl = moved.publicUrl
    }

    if (photo.storage_bucket !== nextBucket || photo.image_url !== nextUrl) {
      const { error: updateError } = await supabase
        .from("photographs")
        .update({
          storage_bucket: nextBucket,
          image_url: nextUrl,
        })
        .eq("id", photo.id)

      if (updateError) {
        throw new Error("No se pudo actualizar la visibilidad de una fotografía.")
      }
    }

    photo.image_url = nextUrl
    photo.storage_bucket = nextBucket
  }

  const cover = (photos ?? []).find((photo) => photo.id === series.cover_photograph_id)
  const { error: coverError } = await supabase
    .from("series")
    .update({ cover_image_url: cover?.image_url ?? null })
    .eq("id", seriesId)

  if (coverError) {
    throw new Error("No se pudo actualizar la portada.")
  }
}
