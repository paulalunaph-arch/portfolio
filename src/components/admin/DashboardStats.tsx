import Link from "next/link"
import type { DashboardData } from "@/types/content"
import { formatBytes, formatDateLabel } from "@/utils/format"

const freeTierBytes = 1024 * 1024 * 1024

export function DashboardStats({ data }: { data: DashboardData }) {
  const stats = [
    ["Series", String(data.totalSeries)],
    ["Publicadas", String(data.publishedSeries)],
    ["Borradores", String(data.draftSeries)],
    ["Fotografías", String(data.totalPhotographs)],
    ["Almacenamiento", data.storageBytes === null ? "No disponible" : formatBytes(data.storageBytes)],
  ]

  return (
    <div>
      <dl className="grid grid-cols-2 gap-px bg-line md:grid-cols-5">
        {stats.map(([label, value]) => (
          <div key={label} className="bg-paper px-4 py-5">
            <dt className="text-[0.68rem] uppercase tracking-[0.16em] text-mute">{label}</dt>
            <dd className="mt-3 font-serif text-4xl tracking-tight">{value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-4 max-w-2xl text-sm leading-6 text-mute">
        El número suma los archivos que el portfolio tiene registrados
        {data.storageBytes !== null ? ` (${Math.round((data.storageBytes / freeTierBytes) * 100)}% de 1 GB)` : ""}.
        El plan gratuito de Supabase incluye 1 GB para todo el proyecto, no solo para estas fotografías.
      </p>
      <div className="mt-8 flex flex-wrap gap-6 text-sm">
        <Link href="/admin/series/nueva" className="underline decoration-line underline-offset-4">
          Nueva serie
        </Link>
        <Link href="/admin/series" className="underline decoration-line underline-offset-4">
          Subir fotografías
        </Link>
        <Link href="/admin/configuracion" className="underline decoration-line underline-offset-4">
          Editar el sitio
        </Link>
      </div>
      <section className="mt-12">
        <h2 className="font-serif text-3xl tracking-tight">Últimos cambios</h2>
        {data.recent.length === 0 ? (
          <p className="mt-4 text-sm text-mute">Todavía no hay series.</p>
        ) : (
          <ul className="mt-4 divide-y divide-line border-y border-line">
            {data.recent.map((item) => (
              <li key={item.id} className="flex flex-wrap items-baseline justify-between gap-3 py-3 text-sm">
                <Link href={`/admin/series/${item.id}`} className="underline decoration-line underline-offset-4">
                  {item.title}
                </Link>
                <span className="text-mute">
                  {item.published ? "Publicada" : "Borrador"}
                  {formatDateLabel(item.updatedAt) ? ` · ${formatDateLabel(item.updatedAt)}` : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
