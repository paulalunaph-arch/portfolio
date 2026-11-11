import { revalidatePath, updateTag } from "next/cache"

export function invalidateSeries(slug?: string | null, previousSlug?: string | null) {
  updateTag("series")
  updateTag("home")

  if (slug) {
    updateTag(`series:${slug}`)
    revalidatePath(`/portfolio/${slug}`)
  }

  if (previousSlug && previousSlug !== slug) {
    updateTag(`series:${previousSlug}`)
    revalidatePath(`/portfolio/${previousSlug}`)
  }

  revalidatePath("/")
  revalidatePath("/portfolio")
  revalidatePath("/admin")
  revalidatePath("/admin/dashboard")
  revalidatePath("/admin/series")
}

export function invalidateSettings() {
  updateTag("settings")
  revalidatePath("/")
  revalidatePath("/sobre-mi")
  revalidatePath("/contacto")
  revalidatePath("/admin/configuracion")
}
