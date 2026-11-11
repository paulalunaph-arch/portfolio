"use client"

import { useState } from "react"
import { deleteSeries } from "@/lib/actions/series"
import { dangerButtonClass, quietButtonClass } from "@/components/ui/controls"
import type { AdminSeries } from "@/types/content"

export function DeleteSeries({ series }: { series: AdminSeries }) {
  const [open, setOpen] = useState(false)

  return (
    <section className="mt-16 border-t border-line pt-8">
      <h2 className="font-serif text-3xl tracking-tight">Eliminar serie</h2>
      {open ? (
        <form action={deleteSeries} className="mt-4 max-w-xl">
          <input type="hidden" name="id" value={series.id} />
          <p className="text-sm leading-6">
            Se va a eliminar «{series.title}» y sus {series.photographCount} fotografías. Los archivos
            también se borran del almacenamiento. Esta acción no se puede deshacer.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button type="submit" className={dangerButtonClass}>
              Eliminar definitivamente
            </button>
            <button type="button" className={quietButtonClass} onClick={() => setOpen(false)}>
              Cancelar
            </button>
          </div>
        </form>
      ) : (
        <button type="button" className={`${dangerButtonClass} mt-4`} onClick={() => setOpen(true)}>
          Eliminar serie
        </button>
      )}
    </section>
  )
}
