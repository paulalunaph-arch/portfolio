"use server"

import { redirect } from "next/navigation"
import { requireAdmin } from "@/lib/auth"
import { invalidateSeries } from "@/lib/cache"
import { syncSeriesVisibility, removeObject } from "@/lib/image-processing/storage"
import { isUuid, readText, validateSeriesInput } from "@/lib/validations/content"
import type { ActionState } from "@/types/content"

function seriesPayload(formData: FormData) {
  const title = readText(formData.get("title"), 160)
  const slug = readText(formData.get("slug"), 80)
  const description = readText(formData.get("description"), 5000)
  const year = readText(formData.get("year"), 4)
  const location = readText(formData.get("location"), 160)
  const published = formData.get("published") === "on"
  const error = validateSeriesInput({ title, slug, description, year, location })

  return {
    error,
    values: {
      title,
      slug,
      description: description || null,
      year: year ? Number(year) : null,
      location: location || null,
      published,
    },
  }
}

async function slugBelongsToAnother(
  supabase: Awaited<ReturnType<typeof requireAdmin>>["supabase"],
  slug: string,
  currentId?: string,
) {
  const { data } = await supabase.from("series").select("id").eq("slug", slug).maybeSingle()
  return Boolean(data && data.id !== currentId)
}

export async function createSeries(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin()
  const { error, values } = seriesPayload(formData)

  if (error) {
    return { error }
  }

  if (await slugBelongsToAnother(supabase, values.slug)) {
    return { error: "Ya existe una categoría con ese enlace." }
  }

  const { data: last } = await supabase
    .from("series")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle()

  const { data, error: insertError } = await supabase
    .from("series")
    .insert({
      ...values,
      sort_order: (last?.sort_order ?? 0) + 1,
    })
    .select("id, slug")
    .single()

  if (insertError || !data) {
    if (insertError?.code === "23505") {
      return { error: "Ya existe una categoría con ese enlace." }
    }

    return { error: "No se pudo crear la categoría." }
  }

  invalidateSeries(data.slug)
  redirect(`/admin/series/${data.id}`)
}

export async function updateSeries(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin()
  const id = String(formData.get("id") ?? "")

  if (!isUuid(id)) {
    return { error: "La categoría no es válida." }
  }

  const { error, values } = seriesPayload(formData)

  if (error) {
    return { error }
  }

  const { data: current } = await supabase.from("series").select("slug").eq("id", id).maybeSingle()

  if (!current) {
    return { error: "La categoría no existe." }
  }

  if (await slugBelongsToAnother(supabase, values.slug, id)) {
    return { error: "Ya existe una categoría con ese enlace." }
  }

  const { error: updateError } = await supabase.from("series").update(values).eq("id", id)

  if (updateError) {
    if (updateError.code === "23505") {
      return { error: "Ya existe una categoría con ese enlace." }
    }

    return { error: "No se pudo guardar la categoría." }
  }

  try {
    await syncSeriesVisibility(supabase, id)
  } catch (syncError) {
    const message = syncError instanceof Error ? syncError.message : "No se pudo actualizar la visibilidad."
    return { error: message }
  }

  invalidateSeries(values.slug, current.slug)
  return { ok: "Categoría guardada." }
}

export async function deleteSeries(formData: FormData) {
  const { supabase } = await requireAdmin()
  const id = String(formData.get("id") ?? "")

  if (!isUuid(id)) {
    redirect("/admin/series")
  }

  const [{ data: photos }, { data: settings }, { data: series }] = await Promise.all([
    supabase.from("photographs").select("storage_bucket, storage_path").eq("series_id", id),
    supabase
      .from("site_settings")
      .select("portrait_storage_path, featured_image_storage_path")
      .limit(1)
      .maybeSingle(),
    supabase.from("series").select("slug").eq("id", id).maybeSingle(),
  ])

  const { error } = await supabase.from("series").delete().eq("id", id)

  if (error) {
    redirect(`/admin/series/${id}?error=delete`)
  }

  const protectedPaths = new Set(
    [settings?.portrait_storage_path, settings?.featured_image_storage_path].filter(Boolean),
  )

  const grouped = new Map<string, string[]>()

  for (const photo of photos ?? []) {
    if (protectedPaths.has(photo.storage_path)) {
      continue
    }

    const bucket = photo.storage_bucket === "portfolio" ? "portfolio" : "library"
    const paths = grouped.get(bucket) ?? []
    paths.push(photo.storage_path)
    grouped.set(bucket, paths)
  }

  for (const [bucket, paths] of grouped) {
    if (paths.length > 0) {
      await supabase.storage.from(bucket).remove(paths)
    }
  }

  const { data: incoming } = await supabase.storage.from("incoming").list(id)

  if (incoming && incoming.length > 0) {
    await supabase.storage.from("incoming").remove(incoming.map((file) => `${id}/${file.name}`))
  }

  invalidateSeries(series?.slug)
  redirect("/admin/series")
}

export async function moveSeries(formData: FormData) {
  const { supabase } = await requireAdmin()
  const id = String(formData.get("id") ?? "")
  const direction = formData.get("direction") === "down" ? 1 : -1

  if (!isUuid(id)) {
    return
  }

  const { data } = await supabase
    .from("series")
    .select("id")
    .order("sort_order", { ascending: true })
    .order("title", { ascending: true })

  const ids = (data ?? []).map((item) => item.id as string)
  const index = ids.indexOf(id)
  const target = index + direction

  if (index < 0 || target < 0 || target >= ids.length) {
    return
  }

  const next = [...ids]
  const [item] = next.splice(index, 1)
  next.splice(target, 0, item)

  await supabase.rpc("reorder_series", { p_ids: next })
  invalidateSeries()
}

export async function discardIncoming(path: string) {
  const { supabase } = await requireAdmin()

  if (!/^(?:[0-9a-f-]{36}\/[0-9a-f-]{36}|site\/[0-9a-f-]{36})$/i.test(path)) {
    return
  }

  await removeObject(supabase, "incoming", path).catch(() => undefined)
}
