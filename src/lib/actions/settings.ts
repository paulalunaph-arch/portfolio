"use server"

import { requireAdmin } from "@/lib/auth"
import { invalidateSettings } from "@/lib/cache"
import { ImageProcessError, optimizeImage } from "@/lib/image-processing/process"
import {
  downloadObject,
  publicObjectUrl,
  removeIfUnreferenced,
  removeObject,
  uploadOptimized,
} from "@/lib/image-processing/storage"
import {
  isUuid,
  readColor,
  readText,
  reductionPercent,
  validateEmail,
  validateSocialLinks,
} from "@/lib/validations/content"
import type { ActionState } from "@/types/content"

function failure(error: unknown) {
  if (error instanceof ImageProcessError) {
    return error.message
  }

  if (error instanceof Error && error.message.startsWith("No se")) {
    return error.message
  }

  return "No se pudo procesar la imagen."
}

export async function updateSettings(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin()
  const photographerName = readText(formData.get("photographer_name"), 120)
  const profession = readText(formData.get("profession"), 160)
  const biography = readText(formData.get("biography"), 8000)
  const education = readText(formData.get("education"), 4000)
  const interests = readText(formData.get("interests"), 4000)
  const authorStatement = readText(formData.get("author_statement"), 2000)
  const email = readText(formData.get("email"), 160)
  const instagram = readText(formData.get("instagram"), 160)
  const seoTitle = readText(formData.get("seo_title"), 160)
  const seoDescription = readText(formData.get("seo_description"), 300)
  const portraitAlt = readText(formData.get("portrait_alt"), 300)
  const featuredAlt = readText(formData.get("featured_image_alt"), 300)
  const emailError = validateEmail(email)

  if (emailError) {
    return { error: emailError }
  }

  const links = validateSocialLinks(String(formData.get("social_links") ?? "[]"))

  if ("error" in links) {
    return { error: links.error }
  }

  const background = readColor(formData.get("color_background"), "El fondo")
  const text = readColor(formData.get("color_text"), "El texto")
  const muted = readColor(formData.get("color_muted"), "El texto secundario")
  const line = readColor(formData.get("color_line"), "Las líneas")
  const colorError = [background, text, muted, line].find((item) => "error" in item)

  if (colorError && "error" in colorError) {
    return { error: colorError.error }
  }

  const { data: settings } = await supabase.from("site_settings").select("id").limit(1).maybeSingle()

  if (!settings) {
    return { error: "No se encontró la configuración del sitio." }
  }

  const { error } = await supabase
    .from("site_settings")
    .update({
      photographer_name: photographerName,
      profession: profession || "Fotoperiodismo / Fotografía documental",
      biography,
      education,
      interests,
      author_statement: authorStatement,
      email,
      instagram,
      social_links: links.links,
      seo_title: seoTitle,
      seo_description: seoDescription,
      portrait_alt: portraitAlt,
      featured_image_alt: featuredAlt,
      color_background: "color" in background ? background.color : undefined,
      color_text: "color" in text ? text.color : undefined,
      color_muted: "color" in muted ? muted.color : undefined,
      color_line: "color" in line ? line.color : undefined,
    })
    .eq("id", settings.id)

  if (error) {
    if (error.message.includes("color_background") || error.code === "PGRST204") {
      return {
        error:
          "Los colores todavía no están en la base. En Supabase, abrí SQL Editor y ejecutá la migración de colores.",
      }
    }

    return { error: "No se pudo guardar la configuración." }
  }

  invalidateSettings()
  return { ok: "Configuración guardada." }
}

export async function finalizeSiteUpload(input: {
  kind: "portrait" | "featured"
  assetId: string
}): Promise<
  | { error: string }
  | {
      ok: true
      width: number
      height: number
      originalBytes: number
      optimizedBytes: number
      reduction: number
      url: string
    }
> {
  const { supabase } = await requireAdmin()

  if ((input.kind !== "portrait" && input.kind !== "featured") || !isUuid(input.assetId)) {
    return { error: "La carga no es válida." }
  }

  const incomingPath = `site/${input.assetId}`
  const storedPath = `site/${input.kind}-${input.assetId}.webp`

  try {
    const { data: settings } = await supabase
      .from("site_settings")
      .select("id, portrait_storage_path, featured_image_storage_path")
      .limit(1)
      .maybeSingle()

    if (!settings) {
      return { error: "No se encontró la configuración del sitio." }
    }

    const previousPath =
      input.kind === "portrait" ? settings.portrait_storage_path : settings.featured_image_storage_path
    const buffer = await downloadObject(supabase, "incoming", incomingPath)
    const processed = await optimizeImage(buffer)
    await uploadOptimized(supabase, "portfolio", storedPath, processed.buffer)
    const url = publicObjectUrl(supabase, storedPath)
    const patch =
      input.kind === "portrait"
        ? {
            portrait_url: url,
            portrait_storage_path: storedPath,
            portrait_width: processed.width,
            portrait_height: processed.height,
            portrait_file_size_bytes: processed.bytes,
          }
        : {
            featured_image_url: url,
            featured_image_storage_path: storedPath,
            featured_width: processed.width,
            featured_height: processed.height,
            featured_file_size_bytes: processed.bytes,
          }

    const { error } = await supabase.from("site_settings").update(patch).eq("id", settings.id)

    if (error) {
      await removeObject(supabase, "portfolio", storedPath).catch(() => undefined)
      return { error: "No se pudo guardar la imagen." }
    }

    if (previousPath && previousPath !== storedPath) {
      await removeIfUnreferenced(supabase, "portfolio", previousPath).catch(() => undefined)
    }

    invalidateSettings()

    return {
      ok: true,
      width: processed.width,
      height: processed.height,
      originalBytes: buffer.byteLength,
      optimizedBytes: processed.bytes,
      reduction: reductionPercent(buffer.byteLength, processed.bytes),
      url,
    }
  } catch (error) {
    await removeObject(supabase, "portfolio", storedPath).catch(() => undefined)
    return { error: failure(error) }
  } finally {
    await removeObject(supabase, "incoming", incomingPath).catch(() => undefined)
  }
}

export async function removeSiteImage(kind: "portrait" | "featured") {
  const { supabase } = await requireAdmin()

  if (kind !== "portrait" && kind !== "featured") {
    return { error: "No se pudo quitar la imagen." }
  }

  const { data: settings } = await supabase
    .from("site_settings")
    .select("id, portrait_storage_path, featured_image_storage_path")
    .limit(1)
    .maybeSingle()

  if (!settings) {
    return { error: "No se encontró la configuración del sitio." }
  }

  const path = kind === "portrait" ? settings.portrait_storage_path : settings.featured_image_storage_path
  const patch =
    kind === "portrait"
      ? {
          portrait_url: null,
          portrait_storage_path: null,
          portrait_width: null,
          portrait_height: null,
          portrait_file_size_bytes: null,
        }
      : {
          featured_image_url: null,
          featured_image_storage_path: null,
          featured_width: null,
          featured_height: null,
          featured_file_size_bytes: null,
        }

  const { error } = await supabase.from("site_settings").update(patch).eq("id", settings.id)

  if (error) {
    return { error: "No se pudo quitar la imagen." }
  }

  await removeIfUnreferenced(supabase, "portfolio", path).catch(() => undefined)
  invalidateSettings()
  return { ok: "Imagen quitada." }
}
