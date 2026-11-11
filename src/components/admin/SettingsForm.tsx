"use client"

import { useActionState, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { updateSettings } from "@/lib/actions/settings"
import { buttonClass, fieldClass, labelClass, quietButtonClass } from "@/components/ui/controls"
import type { ActionState, SiteSettings, SocialLink } from "@/types/content"

export function SettingsForm({ settings }: { settings: SiteSettings }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(updateSettings, {})
  const [links, setLinks] = useState<SocialLink[]>(settings.socialLinks)
  const router = useRouter()

  useEffect(() => {
    if (state.ok) {
      router.refresh()
    }
  }, [state, router])

  return (
    <form action={formAction} className="grid max-w-3xl gap-6">
      <input type="hidden" name="social_links" value={JSON.stringify(links)} />
      <Field id="photographer_name" label="Nombre" defaultValue={settings.photographerName} />
      <Field id="profession" label="Profesión" defaultValue={settings.profession} />
      <Area id="author_statement" label="Declaración autoral" defaultValue={settings.authorStatement} rows={4} />
      <Area id="biography" label="Biografía" defaultValue={settings.biography} rows={8} />
      <Area id="education" label="Formación" defaultValue={settings.education} rows={5} />
      <Area id="interests" label="Intereses" defaultValue={settings.interests} rows={4} />
      <Field id="portrait_alt" label="Texto alternativo del retrato" defaultValue={settings.portraitAlt} />
      <Field id="featured_image_alt" label="Texto alternativo de la portada" defaultValue={settings.featuredImageAlt} />
      <div className="grid gap-6 sm:grid-cols-2">
        <Field id="email" label="Correo" type="email" defaultValue={settings.email} />
        <Field id="instagram" label="Instagram" defaultValue={settings.instagram} />
      </div>
      <fieldset className="grid gap-4">
        <legend className={labelClass}>Enlaces</legend>
        {links.map((link, index) => (
          <div key={index} className="grid gap-3 sm:grid-cols-[1fr_1.4fr_auto]">
            <input
              aria-label={`Nombre del enlace ${index + 1}`}
              value={link.label}
              onChange={(event) => {
                const next = [...links]
                next[index] = { ...link, label: event.target.value }
                setLinks(next)
              }}
              className={fieldClass}
            />
            <input
              aria-label={`URL del enlace ${index + 1}`}
              value={link.url}
              onChange={(event) => {
                const next = [...links]
                next[index] = { ...link, url: event.target.value }
                setLinks(next)
              }}
              className={fieldClass}
            />
            <button
              type="button"
              className={quietButtonClass}
              onClick={() => setLinks(links.filter((_, linkIndex) => linkIndex !== index))}
            >
              Quitar
            </button>
          </div>
        ))}
        <button
          type="button"
          className={quietButtonClass}
          onClick={() => setLinks([...links, { label: "", url: "https://" }])}
        >
          Agregar enlace
        </button>
      </fieldset>
      <Field id="seo_title" label="Título SEO" defaultValue={settings.seoTitle} />
      <Area id="seo_description" label="Descripción SEO" defaultValue={settings.seoDescription} rows={3} />
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
          {pending ? "Guardando…" : "Guardar textos"}
        </button>
      </div>
    </form>
  )
}

function Field({
  id,
  label,
  defaultValue,
  type = "text",
}: {
  id: string
  label: string
  defaultValue: string
  type?: string
}) {
  return (
    <div>
      <label className={labelClass} htmlFor={id}>
        {label}
      </label>
      <input id={id} name={id} type={type} defaultValue={defaultValue} className={fieldClass} />
    </div>
  )
}

function Area({
  id,
  label,
  defaultValue,
  rows,
}: {
  id: string
  label: string
  defaultValue: string
  rows: number
}) {
  return (
    <div>
      <label className={labelClass} htmlFor={id}>
        {label}
      </label>
      <textarea id={id} name={id} rows={rows} defaultValue={defaultValue} className={fieldClass} />
    </div>
  )
}
