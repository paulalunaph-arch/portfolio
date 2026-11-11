import { imageConfig } from "@/lib/image-processing/config"
import type { SocialLink } from "@/types/content"

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
}

export function isUuid(value: string) {
  return uuidPattern.test(value)
}

export function readText(value: FormDataEntryValue | null, max: number) {
  return String(value ?? "").trim().slice(0, max)
}

export function validateSlug(value: string) {
  if (!value || value.length > 80 || !slugPattern.test(value)) {
    return "El enlace solo puede usar minúsculas, números y guiones."
  }

  return null
}

export function validateSeriesInput(input: {
  title: string
  slug: string
  description: string
  year: string
  location: string
}) {
  if (!input.title || input.title.length > 160) {
    return "El título es obligatorio y puede tener hasta 160 caracteres."
  }

  const slugError = validateSlug(input.slug)
  if (slugError) {
    return slugError
  }

  if (input.description.length > 5000) {
    return "La descripción puede tener hasta 5000 caracteres."
  }

  if (input.location.length > 160) {
    return "La ubicación puede tener hasta 160 caracteres."
  }

  if (input.year) {
    const year = Number(input.year)
    if (!Number.isInteger(year) || year < 1900 || year > 2100) {
      return "El año tiene que estar entre 1900 y 2100."
    }
  }

  return null
}

const hexPattern = /^#[0-9a-fA-F]{6}$/

export function readColor(value: FormDataEntryValue | null, label: string) {
  const color = readText(value, 7)

  if (!hexPattern.test(color)) {
    return { error: `${label} tiene que ser un color como #040302.` }
  }

  return { color: color.toLowerCase() }
}

export function validateEmail(value: string) {
  if (!value) {
    return null
  }

  if (value.length > 160 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return "El correo no tiene un formato válido."
  }

  return null
}

export function validateSocialLinks(value: string): { links: SocialLink[] } | { error: string } {
  let parsed: unknown

  try {
    parsed = JSON.parse(value || "[]")
  } catch {
    return { error: "Los enlaces no tienen un formato válido." }
  }

  if (!Array.isArray(parsed)) {
    return { error: "Los enlaces no tienen un formato válido." }
  }

  if (parsed.length > 8) {
    return { error: "Se pueden cargar hasta 8 enlaces." }
  }

  const links: SocialLink[] = []

  for (const item of parsed) {
    if (!item || typeof item !== "object") {
      return { error: "Hay un enlace incompleto." }
    }

    const label = String("label" in item ? item.label : "").trim()
    const url = String("url" in item ? item.url : "").trim()

    if (!label && !url) {
      continue
    }

    if (!label || label.length > 40) {
      return { error: "Cada enlace necesita un nombre de hasta 40 caracteres." }
    }

    if (!/^https:\/\/[^\s]+$/i.test(url) || url.length > 300) {
      return { error: "Cada enlace tiene que empezar con https://." }
    }

    links.push({ label, url })
  }

  return { links }
}

export function validateIncomingFile(file: { name: string; type: string; size: number }) {
  if (!file.name || file.name.length > 180) {
    return "El archivo no tiene un nombre válido."
  }

  if (!imageConfig.allowedMimeTypes.includes(file.type as (typeof imageConfig.allowedMimeTypes)[number])) {
    return "Formato no admitido. Usá JPEG, PNG, WebP o TIFF."
  }

  if (!Number.isFinite(file.size) || file.size <= 0 || file.size > imageConfig.maxUploadBytes) {
    return "El archivo supera el máximo de 20 MB."
  }

  return null
}

export function reductionPercent(original: number, optimized: number) {
  if (original <= 0) {
    return 0
  }

  return Math.max(0, Math.round((1 - optimized / original) * 100))
}
