import Link from "next/link"
import { notFound } from "next/navigation"
import { Suspense } from "react"
import { PhotoGallery } from "@/components/public/PhotoGallery"
import { requireAdmin } from "@/lib/auth"
import { getAdminSeries, listAdminPhotographs } from "@/lib/data/admin"
import { isUuid } from "@/lib/validations/content"
import type { GalleryPhoto } from "@/types/content"
import { metaLine } from "@/utils/format"

export default function PreviewPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<p className="text-sm text-mute">Abriendo la vista previa…</p>}>
      <PreviewContent params={params} />
    </Suspense>
  )
}

async function PreviewContent({ params }: { params: Promise<{ id: string }> }) {
  const { supabase } = await requireAdmin()
  const { id } = await params

  if (!isUuid(id)) {
    notFound()
  }

  const series = await getAdminSeries(supabase, id)

  if (!series) {
    notFound()
  }

  const photos = await listAdminPhotographs(supabase, id)
  const gallery: GalleryPhoto[] = photos.flatMap((photo) => {
    if (!photo.displayUrl) {
      return []
    }

    return [
      {
        id: photo.id,
        src: photo.displayUrl,
        width: photo.width ?? 3,
        height: photo.height ?? 2,
        alt: photo.altText || photo.caption || series.title,
        caption: photo.caption || null,
        location: photo.location || null,
        takenAt: photo.takenAt || null,
      },
    ]
  })

  return (
    <article>
      <p className="text-[0.72rem] uppercase tracking-[0.18em] text-mute">
        Vista previa · {series.published ? "publicada" : "borrador"}
      </p>
      <h1 className="mt-4 max-w-4xl font-serif text-5xl tracking-tight md:text-6xl">{series.title}</h1>
      {metaLine([series.year, series.location]) ? (
        <p className="mt-4 text-[0.72rem] uppercase tracking-[0.16em] text-mute">
          {metaLine([series.year, series.location])}
        </p>
      ) : null}
      {series.description ? (
        <p className="mt-8 max-w-2xl whitespace-pre-line text-lg leading-8">{series.description}</p>
      ) : null}
      <div className="mt-12">
        <PhotoGallery photos={gallery} />
      </div>
      <p className="mt-10">
        <Link href={`/admin/series/${series.id}`} className="text-sm underline underline-offset-4">
          Volver a editar
        </Link>
      </p>
    </article>
  )
}
