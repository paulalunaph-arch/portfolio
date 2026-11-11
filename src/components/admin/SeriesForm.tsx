"use client"

import { useActionState, useState } from "react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { createSeries, updateSeries } from "@/lib/actions/series"
import { buttonClass, fieldClass, labelClass } from "@/components/ui/controls"
import { Hint } from "@/components/ui/Hint"
import { useUnsavedChanges } from "@/components/admin/useUnsavedChanges"
import { slugify } from "@/lib/validations/content"
import type { ActionState, AdminSeries } from "@/types/content"

export function SeriesForm({ series }: { series?: AdminSeries }) {
  const action = series ? updateSeries : createSeries
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, {})
  const [title, setTitle] = useState(series?.title ?? "")
  const [slug, setSlug] = useState(series?.slug ?? "")
  const [slugEdited, setSlugEdited] = useState(Boolean(series))
  const [dirty, setDirty] = useState(false)
  const router = useRouter()

  useUnsavedChanges(dirty && !state.ok)

  useEffect(() => {
    if (state.ok) {
      setDirty(false)
      router.refresh()
    }
  }, [state, router])

  return (
    <form action={formAction} className="grid max-w-3xl gap-6" onChange={() => setDirty(true)}>
      {series ? <input type="hidden" name="id" value={series.id} /> : null}
      <div>
        <label className={labelClass} htmlFor="title">
          Título
        </label>
        <input
          id="title"
          name="title"
          required
          value={title}
          onChange={(event) => {
            const next = event.target.value
            setTitle(next)
            if (!slugEdited) {
              setSlug(slugify(next))
            }
          }}
          className={`${fieldClass} mt-2`}
        />
        <Hint>El nombre de la categoría, tal como se lee en el portfolio. Por ejemplo: Calle.</Hint>
      </div>
      <div>
        <label className={labelClass} htmlFor="slug">
          Enlace
        </label>
        <input
          id="slug"
          name="slug"
          required
          value={slug}
          onChange={(event) => {
            setSlugEdited(true)
            setSlug(slugify(event.target.value))
          }}
          className={`${fieldClass} mt-2`}
        />
        <Hint>
          La dirección de esta categoría: /portfolio/{slug || "nombre-de-la-categoria"}. Se arma sola a partir del
          título. Cambiala solo si querés otra dirección. Sin espacios ni mayúsculas.
        </Hint>
      </div>
      <div>
        <label className={labelClass} htmlFor="description">
          Descripción
        </label>
        <textarea
          id="description"
          name="description"
          rows={6}
          defaultValue={series?.description ?? ""}
          className={`${fieldClass} mt-2`}
        />
        <Hint>El texto que aparece arriba de las fotos, al entrar a la categoría. También se ve, recortado, en el portfolio.</Hint>
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="year">
            Año
          </label>
          <input
            id="year"
            name="year"
            inputMode="numeric"
            defaultValue={series?.year ?? ""}
            className={`${fieldClass} mt-2`}
          />
          <Hint>El año del trabajo. Si no aplica, dejalo vacío.</Hint>
        </div>
        <div>
          <label className={labelClass} htmlFor="location">
            Ubicación
          </label>
          <input
            id="location"
            name="location"
            defaultValue={series?.location ?? ""}
            className={`${fieldClass} mt-2`}
          />
          <Hint>El lugar. Aparece junto al año, arriba de las fotos.</Hint>
        </div>
      </div>
      <div>
        <label className="flex items-center gap-3 text-sm">
          <input type="checkbox" name="published" defaultChecked={series?.published ?? false} className="size-4 accent-ink" />
          Publicada
        </label>
        <Hint>
          Si está marcada, la categoría se ve en el sitio. Si no, queda solo en el estudio, como borrador.
        </Hint>
      </div>
      {state.error ? (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      ) : null}
      {state.ok ? (
        <p role="status" className="text-sm">
          {state.ok}
        </p>
      ) : null}
      <div>
        <button type="submit" className={buttonClass} disabled={pending}>
          {pending ? "Guardando…" : series ? "Guardar categoría" : "Crear categoría"}
        </button>
      </div>
    </form>
  )
}
