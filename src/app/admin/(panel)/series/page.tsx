import Link from "next/link"
import { moveSeries } from "@/lib/actions/series"
import { quietButtonClass } from "@/components/ui/controls"
import { requireAdmin } from "@/lib/auth"
import { listAdminSeries } from "@/lib/data/admin"

export default async function SeriesIndexPage() {
  const { supabase } = await requireAdmin()
  const series = await listAdminSeries(supabase)

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[0.72rem] uppercase tracking-[0.18em] text-mute">Archivo</p>
          <h1 className="mt-3 font-serif text-5xl tracking-tight">Series</h1>
        </div>
        <Link href="/admin/series/nueva" className="text-[0.72rem] uppercase tracking-[0.16em] underline underline-offset-4">
          Nueva serie
        </Link>
      </div>
      {series.length === 0 ? (
        <p className="mt-10 max-w-md text-sm leading-6 text-mute">
          Todavía no hay series. La primera puede quedar en borrador hasta que tenga fotografías.
        </p>
      ) : (
        <ul className="mt-10 border-b border-line">
          {series.map((item) => (
            <li key={item.id} className="grid gap-4 border-t border-line py-5 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <Link href={`/admin/series/${item.id}`} className="font-serif text-3xl tracking-tight">
                  {item.title}
                </Link>
                <p className="mt-2 text-sm text-mute">
                  {item.published ? "Publicada" : "Borrador"} · {item.photographCount} fotografías · /portfolio/
                  {item.slug}
                </p>
              </div>
              <div className="flex gap-2">
                <form action={moveSeries}>
                  <input type="hidden" name="id" value={item.id} />
                  <input type="hidden" name="direction" value="up" />
                  <button type="submit" className={quietButtonClass}>
                    Subir
                  </button>
                </form>
                <form action={moveSeries}>
                  <input type="hidden" name="id" value={item.id} />
                  <input type="hidden" name="direction" value="down" />
                  <button type="submit" className={quietButtonClass}>
                    Bajar
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
