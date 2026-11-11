"use client"

import { useActionState, useState } from "react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { createSeries, updateSeries } from "@/lib/actions/series"
import { buttonClass, fieldClass, labelClass } from "@/components/ui/controls"
import { slugify } from "@/lib/validations/content"
import type { ActionState, AdminSeries } from "@/types/content"

export function SeriesForm({ series }: { series?: AdminSeries }) {
  const action = series ? updateSeries : createSeries
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, {})
  const [title, setTitle] = useState(series?.title ?? "")
  const [slug, setSlug] = useState(series?.slug ?? "")
  const [slugEdited, setSlugEdited] = useState(Boolean(series))
  const router = useRouter()

  useEffect(() => {
    if (state.ok) {
      router.refresh()
    }
  }, [state, router])

  return (
    <form action={formAction} className="grid max-w-3xl gap-6">
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
          className={fieldClass}
        />
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
          className={fieldClass}
        />
        <p className="mt-2 text-sm text-mute">/portfolio/{slug || "nombre-de-la-serie"}</p>
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
          className={fieldClass}
        />
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
            className={fieldClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="location">
            Ubicación
          </label>
          <input
            id="location"
            name="location"
            defaultValue={series?.location ?? ""}
            className={fieldClass}
          />
        </div>
      </div>
      <label className="flex items-center gap-3 text-sm">
        <input type="checkbox" name="published" defaultChecked={series?.published ?? false} className="size-4 accent-ink" />
        Publicada
      </label>
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
          {pending ? "Guardando…" : series ? "Guardar serie" : "Crear serie"}
        </button>
      </div>
    </form>
  )
}
