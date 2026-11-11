"use client"

import { useActionState, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { updateSettings } from "@/lib/actions/settings"
import { buttonClass, fieldClass, labelClass, quietButtonClass } from "@/components/ui/controls"
import { Hint } from "@/components/ui/Hint"
import { useUnsavedChanges } from "@/components/admin/useUnsavedChanges"
import type { ActionState, SiteSettings, SocialLink } from "@/types/content"

const colorFields = [
  {
    id: "color_background",
    label: "Fondo",
    hint: "El color de atrás de todas las páginas, también del estudio. Un negro cálido, no el negro puro.",
  },
  {
    id: "color_text",
    label: "Texto",
    hint: "Títulos, nombres y párrafos. Conviene un blanco tiza, no el blanco puro.",
  },
  {
    id: "color_muted",
    label: "Texto secundario",
    hint: "Etiquetas, fechas, pies y textos más chicos. Tiene que leerse sobre el fondo, pero menos que el texto principal.",
  },
  {
    id: "color_line",
    label: "Líneas",
    hint: "Separadores y bordes. Si el fondo es muy oscuro, esta línea tiene que ser apenas más clara para verse.",
  },
] as const

type ColorId = (typeof colorFields)[number]["id"]

export function SettingsForm({ settings }: { settings: SiteSettings }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(updateSettings, {})
  const [links, setLinks] = useState<SocialLink[]>(settings.socialLinks)
  const [colors, setColors] = useState<Record<ColorId, string>>({
    color_background: settings.colorBackground,
    color_text: settings.colorText,
    color_muted: settings.colorMuted,
    color_line: settings.colorLine,
  })
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
    <form action={formAction} className="grid max-w-3xl gap-8" onChange={() => setDirty(true)}>
      <input type="hidden" name="social_links" value={JSON.stringify(links)} />
      <fieldset className="grid gap-6">
        <legend className="font-serif text-3xl tracking-tight">Colores</legend>
        <Hint>
          Cambian el sitio público y el estudio al guardar. Elegí el color o pegá el código de seis cifras.
        </Hint>
        <div
          className="border p-5"
          style={{
            background: colors.color_background,
            color: colors.color_text,
            borderColor: colors.color_line,
          }}
        >
          <p className="text-[0.68rem] uppercase tracking-[0.16em]" style={{ color: colors.color_muted }}>
            Vista previa
          </p>
          <p className="mt-3 font-serif text-4xl tracking-tight">Así se va a ver el sitio</p>
          <p className="mt-3 max-w-md text-sm leading-6" style={{ color: colors.color_muted }}>
            Este recuadro usa los colores de abajo, antes de guardarlos.
          </p>
        </div>
        {colorFields.map((field) => (
          <div key={field.id}>
            <label className={labelClass} htmlFor={field.id}>
              {field.label}
            </label>
            <div className="mt-2 flex items-center gap-3">
              <input
                aria-label={`Elegir ${field.label}`}
                type="color"
                value={colors[field.id]}
                onChange={(event) => setColors({ ...colors, [field.id]: event.target.value })}
                className="size-11 cursor-pointer border border-line bg-transparent p-1"
              />
              <input
                id={field.id}
                name={field.id}
                value={colors[field.id]}
                spellCheck={false}
                onChange={(event) => setColors({ ...colors, [field.id]: event.target.value })}
                className={fieldClass}
              />
            </div>
            <Hint>{field.hint}</Hint>
          </div>
        ))}
      </fieldset>
      <Field
        id="photographer_name"
        label="Nombre"
        defaultValue={settings.photographerName}
        hint="El nombre que se lee en la barra, en el pie y como título de Sobre mí y Contacto."
      />
      <Field
        id="profession"
        label="Profesión"
        defaultValue={settings.profession}
        hint="La línea corta debajo del nombre en Sobre mí. Por ejemplo: Fotoperiodismo / Fotografía documental."
      />
      <Area
        id="author_statement"
        label="Mirada"
        defaultValue={settings.authorStatement}
        rows={4}
        hint="Un texto breve, en primera persona, sobre cómo entiende el trabajo. En Sobre mí aparece con el título Mirada."
      />
      <Area
        id="biography"
        label="Biografía"
        defaultValue={settings.biography}
        rows={8}
        hint="El texto más largo. En Sobre mí aparece con el título Biografía. Podés usar varios párrafos."
      />
      <Area
        id="education"
        label="Formación"
        defaultValue={settings.education}
        rows={5}
        hint="Estudios, talleres o recorridos. En Sobre mí aparece con el título Formación."
      />
      <Area
        id="interests"
        label="Intereses"
        defaultValue={settings.interests}
        rows={4}
        hint="Temas que le interesan fotografiar. En Sobre mí aparece con el título Intereses."
      />
      <Field
        id="portrait_alt"
        label="Texto alternativo del retrato"
        defaultValue={settings.portraitAlt}
        hint="Describe la foto de Sobre mí para quien no puede verla. No se muestra como texto en la página."
      />
      <Field
        id="featured_image_alt"
        label="Texto alternativo de la imagen para compartir"
        defaultValue={settings.featuredImageAlt}
        hint="Describe la imagen que aparece al compartir el enlace del sitio. No se muestra en la página."
      />
      <div className="grid gap-6 sm:grid-cols-2">
        <Field
          id="email"
          label="Correo"
          type="email"
          defaultValue={settings.email}
          hint="Aparece en el pie y en Contacto. Al tocarlo se abre el mail."
        />
        <Field
          id="instagram"
          label="Instagram"
          defaultValue={settings.instagram}
          hint="El usuario, sin arroba, o el enlace completo. Aparece en el pie y en Contacto."
        />
      </div>
      <fieldset className="grid gap-4">
        <legend className={labelClass}>Otros enlaces</legend>
        <Hint>
          Sitios extra, además del correo y de Instagram. El nombre es lo que se lee (por ejemplo Behance) y la
          dirección es a dónde lleva. Aparecen en Contacto y en el pie.
        </Hint>
        {links.map((link, index) => (
          <div key={index} className="grid gap-3 sm:grid-cols-[1fr_1.4fr_auto]">
            <input
              aria-label={`Nombre del enlace ${index + 1}`}
              placeholder="Nombre"
              value={link.label}
              onChange={(event) => {
                const next = [...links]
                next[index] = { ...link, label: event.target.value }
                setLinks(next)
              }}
              className={fieldClass}
            />
            <input
              aria-label={`Dirección del enlace ${index + 1}`}
              placeholder="https://"
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
              onClick={() => {
                setDirty(true)
                setLinks(links.filter((_, linkIndex) => linkIndex !== index))
              }}
            >
              Quitar
            </button>
          </div>
        ))}
        <button
          type="button"
          className={quietButtonClass}
          onClick={() => {
            setDirty(true)
            setLinks([...links, { label: "", url: "https://" }])
          }}
        >
          Agregar enlace
        </button>
      </fieldset>
      <Field
        id="seo_title"
        label="Título para buscadores"
        defaultValue={settings.seoTitle}
        hint="El título de la pestaña y el que puede mostrar Google cuando no hay uno más específico. Suele ser el nombre."
      />
      <Area
        id="seo_description"
        label="Descripción para buscadores"
        defaultValue={settings.seoDescription}
        rows={3}
        hint="Una o dos frases que Google puede mostrar debajo del título. No aparece como texto dentro de las páginas."
      />
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
          {pending ? "Guardando…" : "Guardar"}
        </button>
      </div>
    </form>
  )
}

function Field({
  id,
  label,
  defaultValue,
  hint,
  type = "text",
}: {
  id: string
  label: string
  defaultValue: string
  hint: string
  type?: string
}) {
  return (
    <div>
      <label className={labelClass} htmlFor={id}>
        {label}
      </label>
      <input id={id} name={id} type={type} defaultValue={defaultValue} className={`${fieldClass} mt-2`} />
      <Hint>{hint}</Hint>
    </div>
  )
}

function Area({
  id,
  label,
  defaultValue,
  rows,
  hint,
}: {
  id: string
  label: string
  defaultValue: string
  rows: number
  hint: string
}) {
  return (
    <div>
      <label className={labelClass} htmlFor={id}>
        {label}
      </label>
      <textarea id={id} name={id} rows={rows} defaultValue={defaultValue} className={`${fieldClass} mt-2`} />
      <Hint>{hint}</Hint>
    </div>
  )
}
