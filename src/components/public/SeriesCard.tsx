import Image from "next/image"
import Link from "next/link"
import type { SeriesSummary } from "@/types/content"

export function SeriesCard({ series }: { series: SeriesSummary }) {
  return (
    <article>
      <Link href={`/portfolio/${series.slug}`} className="group block text-ink no-underline">
        {series.coverUrl ? (
          <div className="relative aspect-[3/2] overflow-hidden bg-[#f3f3f0]">
            <Image
              src={series.coverUrl}
              alt={series.coverAlt}
              fill
              sizes="(min-width: 768px) 46vw, 100vw"
              className="object-cover transition duration-300 group-hover:scale-[1.012] group-hover:opacity-95"
            />
          </div>
        ) : (
          <div className="flex aspect-[3/2] items-end bg-[#f3f3f0] p-5">
            <p className="text-sm text-mute">Sin portada</p>
          </div>
        )}
        {series.location || series.year ? (
          <div className="mt-4 flex justify-between gap-4 text-[10.5px] uppercase tracking-[0.12em] text-mute">
            <span>{series.location}</span>
            {series.year ? <span>{series.year}</span> : null}
          </div>
        ) : null}
        <h2 className="mt-4 max-w-[630px] font-serif text-[clamp(1.65rem,2.1vw,2.125rem)] leading-[1.08] tracking-[-0.024em]">
          {series.title}
        </h2>
        {series.description ? (
          <p className="mt-3.5 line-clamp-3 max-w-[570px] text-sm leading-[1.6] text-mute">{series.description}</p>
        ) : null}
        <span className="mt-5 inline-flex text-[11px] uppercase tracking-[0.1em]">Ver serie</span>
      </Link>
    </article>
  )
}
