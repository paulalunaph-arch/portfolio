import Link from "next/link"
import { notFound } from "next/navigation"
import { DeleteSeries } from "@/components/admin/DeleteSeries"
import { PhotographManager } from "@/components/admin/PhotographManager"
import { PhotographUploader } from "@/components/admin/PhotographUploader"
import { SeriesForm } from "@/components/admin/SeriesForm"
import { requireAdmin } from "@/lib/auth"
import { getAdminSeries, listAdminPhotographs } from "@/lib/data/admin"
import { isUuid } from "@/lib/validations/content"

export default async function EditSeriesPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const { supabase } = await requireAdmin()
  const [{ id }, query] = await Promise.all([params, searchParams])

  if (!isUuid(id)) {
    notFound()
  }

  const series = await getAdminSeries(supabase, id)

  if (!series) {
    notFound()
  }

  const photos = await listAdminPhotographs(supabase, id)

  return (
    <div>
      <p className="text-[0.72rem] uppercase tracking-[0.18em] text-mute">
        <Link href="/admin/series" className="underline underline-offset-4">
          Series
        </Link>
      </p>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-serif text-5xl tracking-tight">{series.title}</h1>
        <div className="flex flex-wrap gap-4 text-sm">
          <Link href={`/admin/series/${series.id}/vista-previa`} className="underline underline-offset-4">
            Vista previa
          </Link>
          {series.published ? (
            <Link href={`/portfolio/${series.slug}`} className="underline underline-offset-4">
              Ver publicada
            </Link>
          ) : null}
        </div>
      </div>
      {query.error === "delete" ? (
        <p role="alert" className="mt-6 text-sm text-danger">
          No se pudo eliminar la serie.
        </p>
      ) : null}
      <div className="mt-10">
        <SeriesForm series={series} />
      </div>
      <PhotographUploader seriesId={series.id} />
      <PhotographManager
        key={photos.map((photo) => `${photo.id}:${photo.sortOrder}:${photo.homeSelected ? "1" : "0"}:${photo.displayUrl ?? ""}`).join("|")}
        seriesId={series.id}
        coverId={series.coverPhotographId}
        photos={photos}
      />
      <DeleteSeries series={series} />
    </div>
  )
}
