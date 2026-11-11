export function formatBytes(bytes: number | null | undefined) {
  if (bytes == null || Number.isNaN(bytes)) {
    return "—"
  }

  if (bytes < 1024) {
    return `${bytes} B`
  }

  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`
  }

  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

export function formatDateLabel(value: string | null | undefined) {
  if (!value) {
    return null
  }

  const [year, month, day] = value.slice(0, 10).split("-")

  if (!year || !month || !day) {
    return null
  }

  return `${day}.${month}.${year}`
}

export function instagramHref(value: string) {
  const trimmed = value.trim()

  if (!trimmed) {
    return null
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed
  }

  return `https://instagram.com/${trimmed.replace(/^@/, "")}`
}

export function instagramLabel(value: string) {
  const trimmed = value.trim()

  if (!trimmed) {
    return ""
  }

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const url = new URL(trimmed)
      const handle = url.pathname.split("/").filter(Boolean)[0]
      return handle ? `@${handle}` : trimmed
    } catch {
      return trimmed
    }
  }

  return trimmed.startsWith("@") ? trimmed : `@${trimmed}`
}

export function metaLine(parts: Array<string | number | null | undefined>) {
  return parts.filter((part) => part !== null && part !== undefined && part !== "").join(" · ")
}
