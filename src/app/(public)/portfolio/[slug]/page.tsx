import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Suspense } from "react"
import { connection } from "next/server"
import { PhotoGallery } from "@/components/public/PhotoGallery"
import { getPublishedSeries, getPublishedSeriesBySlug, getSiteSettings } from "@/lib/data/public"
import { metaLine } from "@/utils/format"

type RouteParams = { slug: string }

export async function generateMetadata({
  params,
}: {
  params: Promise<RouteParams>
}): Promise<Metadata> {
  await connection()
  const { slug } = await params
  const [series, settings] = await Promise.all([
    getPublishedSeriesBySlug(slug),
    getSiteSettings(),
  ])

  if (!series) {
    notFound()
  }

  const name = settings.photographerName || "Portfolio"
  const description = series.description || settings.seoDescription || settings.profession

  return {
    title: series.title,
    description,
    openGraph: {
      title: `${series.title} · ${name}`,
      description,
      images: series.coverUrl ? [{ url: series.coverUrl }] : undefined,
    },
  }
}

export default function SeriesPage({ params }: { params: Promise<RouteParams> }) {
  return (
    <Suspense fallback={<p className="px-5 py-20 text-sm text-mute">Cargando la serie…</p>}>
      <SeriesContent params={params} />
    </Suspense>
  )
}

async function SeriesContent({ params }: { params: Promise<RouteParams> }) {
  await connection()
  const { slug } = await params
  const [series, all] = await Promise.all([getPublishedSeriesBySlug(slug), getPublishedSeries()])

  if (!series) {
    notFound()
  }

  const index = all.findIndex((item) => item.slug === series.slug)
  const previous = index > 0 ? all[index - 1] : null
  const next = index >= 0 && index < all.length - 1 ? all[index + 1] : null
  const meta = metaLine([series.year, series.location])

  return (
    <article className="mx-auto max-w-[1440px] px-5 py-14 md:px-10 md:py-20 lg:px-11">
      <p className="text-[0.72rem] uppercase tracking-[0.18em] text-mute">
        <Link href="/portfolio" className="underline decoration-line underline-offset-4">
          Portfolio
        </Link>
      </p>
      <h1 className="mt-4 max-w-4xl font-serif text-5xl tracking-tight md:text-7xl">{series.title}</h1>
      {meta ? <p className="mt-4 text-[0.72rem] uppercase tracking-[0.16em] text-mute">{meta}</p> : null}
      {series.description ? (
        <p className="mt-8 max-w-2xl whitespace-pre-line text-lg leading-8">{series.description}</p>
      ) : null}
      <div className="mt-16">
        <PhotoGallery photos={series.photos} />
      </div>
      <nav className="mt-20 grid gap-6 border-t border-line pt-8 sm:grid-cols-2" aria-label="Otras series">
        {previous ? (
          <Link href={`/portfolio/${previous.slug}`} className="text-sm">
            <span className="block text-[0.68rem] uppercase tracking-[0.16em] text-mute">Anterior</span>
            <span className="mt-2 block font-serif text-2xl">{previous.title}</span>
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link href={`/portfolio/${next.slug}`} className="text-sm sm:text-right">
            <span className="block text-[0.68rem] uppercase tracking-[0.16em] text-mute">Siguiente</span>
            <span className="mt-2 block font-serif text-2xl">{next.title}</span>
          </Link>
        ) : null}
      </nav>
    </article>
  )
}
