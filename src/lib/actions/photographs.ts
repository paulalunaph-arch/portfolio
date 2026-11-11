"use server"

import { requireAdmin } from "@/lib/auth"
import { invalidateSeries } from "@/lib/cache"
import { imageConfig } from "@/lib/image-processing/config"
import { ImageProcessError, optimizeImage } from "@/lib/image-processing/process"
import {
  downloadObject,
  publicObjectUrl,
  removeIfUnreferenced,
  removeObject,
  syncSeriesVisibility,
  uploadOptimized,
} from "@/lib/image-processing/storage"
import { isUuid, reductionPercent, validateIncomingFile } from "@/lib/validations/content"

type UploadTicket = {
  photoId: string
  path: string
  token: string
  signedUrl: string
}

type UploadSuccess = {
  ok: true
  width: number
  height: number
  originalBytes: number
  optimizedBytes: number
  reduction: number
}

function failure(error: unknown) {
  if (error instanceof ImageProcessError) {
    return error.message
  }

  if (error instanceof Error && error.message.startsWith("No se")) {
    return error.message
  }

  return "No se pudo procesar la imagen."
}

export async function prepareSeriesUpload(
  seriesId: string,
  file: { name: string; type: string; size: number },
): Promise<{ error: string } | UploadTicket> {
  const { supabase } = await requireAdmin()

  if (!isUuid(seriesId)) {
    return { error: "La categoría no es válida." }
  }

  const invalid = validateIncomingFile(file)

  if (invalid) {
    return { error: invalid }
  }

  const { data: series } = await supabase.from("series").select("id").eq("id", seriesId).maybeSingle()

  if (!series) {
    return { error: "La categoría no existe." }
  }

  const photoId = crypto.randomUUID()
  const path = `${seriesId}/${photoId}`
  const { data, error } = await supabase.storage.from("incoming").createSignedUploadUrl(path)

  if (error || !data) {
    return { error: "No se pudo preparar la carga." }
  }

  return {
    photoId,
    path,
    token: data.token,
    signedUrl: data.signedUrl,
  }
}

export async function finalizeSeriesUpload(input: {
  seriesId: string
  photoId: string
}): Promise<{ error: string } | UploadSuccess> {
  const { supabase } = await requireAdmin()
  const { seriesId, photoId } = input

  if (!isUuid(seriesId) || !isUuid(photoId)) {
    return { error: "La carga no es válida." }
  }

  const incomingPath = `${seriesId}/${photoId}`
  const storedPath = `${seriesId}/${photoId}.webp`
  let storedBucket: "portfolio" | "library" | null = null

  try {
    const { data: series } = await supabase
      .from("series")
      .select("id, published, slug, cover_photograph_id")
      .eq("id", seriesId)
      .maybeSingle()

    if (!series) {
      return { error: "La categoría no existe." }
    }

    const buffer = await downloadObject(supabase, "incoming", incomingPath)
    const processed = await optimizeImage(buffer)
    const bucket = series.published ? "portfolio" : "library"
    await uploadOptimized(supabase, bucket, storedPath, processed.buffer)
    storedBucket = bucket

    const { data: last } = await supabase
      .from("photographs")
      .select("sort_order")
      .eq("series_id", seriesId)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle()

    const imageUrl = bucket === "portfolio" ? publicObjectUrl(supabase, storedPath) : null
    const { error } = await supabase.from("photographs").insert({
      id: photoId,
      series_id: seriesId,
      image_url: imageUrl,
      storage_path: storedPath,
      storage_bucket: bucket,
      sort_order: (last?.sort_order ?? 0) + 1,
      published: true,
      width: processed.width,
      height: processed.height,
      format: "webp",
      file_size_bytes: processed.bytes,
      original_file_size_bytes: buffer.byteLength,
    })

    if (error) {
      throw new Error("No se pudo registrar la fotografía.")
    }

    if (!series.cover_photograph_id) {
      await supabase
        .from("series")
        .update({
          cover_photograph_id: photoId,
          cover_image_url: imageUrl,
        })
        .eq("id", seriesId)
    }

    invalidateSeries(series.slug)

    return {
      ok: true,
      width: processed.width,
      height: processed.height,
      originalBytes: buffer.byteLength,
      optimizedBytes: processed.bytes,
      reduction: reductionPercent(buffer.byteLength, processed.bytes),
    }
  } catch (error) {
    if (storedBucket) {
      await removeObject(supabase, storedBucket, storedPath).catch(() => undefined)
    }

    return { error: failure(error) }
  } finally {
    await removeObject(supabase, "incoming", incomingPath).catch(() => undefined)
  }
}

type PhotoDraft = {
  id: string
  caption: string
  altText: string
  location: string
  takenAt: string
  published: boolean
  homeSelected: boolean
}

function validDate(value: string) {
  if (!value) {
    return true
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)

  if (!match) {
    return false
  }

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  return year >= 1900 && year <= 2100 && month >= 1 && month <= 12 && day >= 1 && day <= 31
}

export async function savePhotographs(seriesId: string, drafts: PhotoDraft[]) {
  const { supabase } = await requireAdmin()

  if (!isUuid(seriesId)) {
    return { error: "La categoría no es válida." }
  }

  const { data: series } = await supabase.from("series").select("slug").eq("id", seriesId).maybeSingle()

  if (!series) {
    return { error: "La categoría no existe." }
  }

  const { data: currentRows, error: currentError } = await supabase
    .from("photographs")
    .select("id, home_selected, home_sort_order")
    .eq("series_id", seriesId)

  if (currentError) {
    return { error: "No se pudieron guardar los cambios." }
  }

  const current = new Map(
    (currentRows ?? []).map((row) => [
      row.id as string,
      {
        homeSelected: Boolean(row.home_selected),
        homeSortOrder: Number(row.home_sort_order ?? 0),
      },
    ]),
  )

  const { data: lastHome } = await supabase
    .from("photographs")
    .select("home_sort_order")
    .order("home_sort_order", { ascending: false })
    .limit(1)
    .maybeSingle()

  let nextHomeOrder = Number(lastHome?.home_sort_order ?? 0) + 1

  for (const draft of drafts) {
    if (!isUuid(draft.id)) {
      return { error: "Hay una fotografía que no se puede guardar." }
    }

    if (draft.caption.length > 1000 || draft.altText.length > 300 || draft.location.length > 160) {
      return { error: "Algún texto supera el largo permitido." }
    }

    if (!validDate(draft.takenAt)) {
      return { error: "Hay una fecha inválida." }
    }

    const previous = current.get(draft.id)
    let homeSortOrder = previous?.homeSortOrder ?? 0

    if (draft.homeSelected && !previous?.homeSelected) {
      homeSortOrder = nextHomeOrder
      nextHomeOrder += 1
    }

    const { error } = await supabase
      .from("photographs")
      .update({
        caption: draft.caption.trim() || null,
        alt_text: draft.altText.trim() || null,
        location: draft.location.trim() || null,
        taken_at: draft.takenAt || null,
        published: Boolean(draft.published),
        home_selected: Boolean(draft.homeSelected),
        home_sort_order: homeSortOrder,
      })
      .eq("id", draft.id)
      .eq("series_id", seriesId)

    if (error) {
      return { error: "No se pudieron guardar los cambios." }
    }
  }

  try {
    await syncSeriesVisibility(supabase, seriesId)
  } catch (error) {
    return { error: failure(error) }
  }

  invalidateSeries(series.slug)
  return { ok: "Cambios guardados." }
}

export async function reorderPhotographs(seriesId: string, ids: string[]) {
  const { supabase } = await requireAdmin()

  if (!isUuid(seriesId) || ids.some((id) => !isUuid(id))) {
    return { error: "No se pudo reordenar." }
  }

  const { data: series } = await supabase.from("series").select("slug").eq("id", seriesId).maybeSingle()
  const { error } = await supabase.rpc("reorder_photographs", {
    p_series_id: seriesId,
    p_ids: ids,
  })

  if (error) {
    return { error: "No se pudo guardar el orden." }
  }

  invalidateSeries(series?.slug)
  return { ok: "Orden actualizado." }
}

export async function setCover(seriesId: string, photographId: string) {
  const { supabase } = await requireAdmin()

  if (!isUuid(seriesId) || !isUuid(photographId)) {
    return { error: "No se pudo elegir la portada." }
  }

  const { data: photo } = await supabase
    .from("photographs")
    .select("id")
    .eq("id", photographId)
    .eq("series_id", seriesId)
    .maybeSingle()

  if (!photo) {
    return { error: "Esa fotografía no pertenece a la categoría." }
  }

  const { error } = await supabase
    .from("series")
    .update({ cover_photograph_id: photographId })
    .eq("id", seriesId)

  if (error) {
    return { error: "No se pudo actualizar la portada." }
  }

  try {
    await syncSeriesVisibility(supabase, seriesId)
  } catch (syncError) {
    return { error: failure(syncError) }
  }

  const { data: series } = await supabase.from("series").select("slug").eq("id", seriesId).maybeSingle()
  invalidateSeries(series?.slug)
  return { ok: "Portada actualizada." }
}

export async function deletePhotograph(seriesId: string, photographId: string) {
  const { supabase } = await requireAdmin()

  if (!isUuid(seriesId) || !isUuid(photographId)) {
    return { error: "No se pudo eliminar la fotografía." }
  }

  const { data: photo } = await supabase
    .from("photographs")
    .select("storage_bucket, storage_path")
    .eq("id", photographId)
    .eq("series_id", seriesId)
    .maybeSingle()

  if (!photo) {
    return { error: "La fotografía no existe." }
  }

  const { error } = await supabase
    .from("photographs")
    .delete()
    .eq("id", photographId)
    .eq("series_id", seriesId)

  if (error) {
    return { error: "No se pudo eliminar la fotografía." }
  }

  const bucket = photo.storage_bucket === "portfolio" ? "portfolio" : "library"

  try {
    await removeIfUnreferenced(supabase, bucket, photo.storage_path)
    await syncSeriesVisibility(supabase, seriesId)
  } catch (deleteError) {
    return { error: failure(deleteError) }
  }

  const { data: series } = await supabase.from("series").select("slug").eq("id", seriesId).maybeSingle()
  invalidateSeries(series?.slug)
  return { ok: "Fotografía eliminada." }
}

export async function prepareSiteUpload(file: {
  name: string
  type: string
  size: number
}): Promise<{ error: string } | { assetId: string; path: string; token: string; signedUrl: string }> {
  const { supabase } = await requireAdmin()
  const invalid = validateIncomingFile(file)

  if (invalid) {
    return { error: invalid }
  }

  if (file.size > imageConfig.maxUploadBytes) {
    return { error: "El archivo supera el máximo de 20 MB." }
  }

  const assetId = crypto.randomUUID()
  const path = `site/${assetId}`
  const { data, error } = await supabase.storage.from("incoming").createSignedUploadUrl(path)

  if (error || !data) {
    return { error: "No se pudo preparar la carga." }
  }

  return { assetId, path, token: data.token, signedUrl: data.signedUrl }
}
