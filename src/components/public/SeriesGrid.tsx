import { SeriesCard } from "@/components/public/SeriesCard"
import type { SeriesSummary } from "@/types/content"

export function SeriesGrid({ series }: { series: SeriesSummary[] }) {
  if (series.length === 0) {
    return (
      <p className="max-w-md text-lg leading-8 text-mute">
        Todavía no hay series publicadas.
      </p>
    )
  }

  return (
    <ol className="grid grid-cols-1 gap-14 md:grid-cols-2 md:gap-x-10 md:gap-y-24">
      {series.map((item) => (
        <li key={item.id} className="min-w-0">
          <SeriesCard series={item} />
        </li>
      ))}
    </ol>
  )
}
