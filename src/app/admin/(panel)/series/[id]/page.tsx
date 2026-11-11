import Link from "next/link"
import { notFound } from "next/navigation"
import { Suspense } from "react"
import { DeleteSeries } from "@/components/admin/DeleteSeries"
import { PhotographManager } from "@/components/admin/PhotographManager"
import { PhotographUploader } from "@/components/admin/PhotographUploader"
import { NewSeries } from "@/components/admin/NewSeries"
import { SeriesForm } from "@/components/admin/SeriesForm"
import { requireAdmin } from "@/lib/auth"
import { getAdminSeries, listAdminPhotographs } from "@/lib/data/admin"
import { isUuid } from "@/lib/validations/content"

export default function EditSeriesPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string }>
}) {
  return (
    <Suspense fallback={<p className="text-sm text-mute">Abriendo la categoría…</p>}>
      <EditSeriesContent params={params} searchParams={searchParams} />
    </Suspense>
  )
}

async function EditSeriesContent({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const { supabase } = await requireAdmin()
  const [{ id }, query] = await Promise.all([params, searchParams])

  // La ruta dinámica también puede recibir "nueva" y tapar la página estática.
  if (id === "nueva") {
    return <NewSeries />
  }

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
          Categorías
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
          No se pudo eliminar la categoría.
        </p>
      ) : null}
      <div className="mt-10">
        <SeriesForm series={series} />
      </div>
      <PhotographUploader seriesId={series.id} />
      <PhotographManager seriesId={series.id} coverId={series.coverPhotographId} photos={photos} />
      <DeleteSeries series={series} />
    </div>
  )
}
