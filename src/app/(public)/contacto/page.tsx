import type { Metadata } from "next"
import { Suspense } from "react"
import { connection } from "next/server"
import { getSiteSettings } from "@/lib/data/public"
import { instagramHref, instagramLabel } from "@/utils/format"

export const metadata: Metadata = {
  title: "Contacto",
}

export default function ContactPage() {
  return (
    <Suspense fallback={<p className="px-5 py-20 text-sm text-mute">Cargando…</p>}>
      <ContactContent />
    </Suspense>
  )
}

async function ContactContent() {
  await connection()
  const settings = await getSiteSettings()
  const instagram = instagramHref(settings.instagram)
  const hasContact = Boolean(settings.email || instagram || settings.socialLinks.length > 0)

  return (
    <div className="mx-auto max-w-[1600px] px-5 py-14 md:px-10 md:py-20 lg:px-16">
      <p className="text-[0.72rem] uppercase tracking-[0.18em] text-mute">Contacto</p>
      <h1 className="mt-4 max-w-3xl font-serif text-5xl tracking-tight md:text-7xl">
        {settings.photographerName || "Escribir"}
      </h1>
      {hasContact ? (
        <ul className="mt-12 flex max-w-xl flex-col gap-5 text-lg">
          {settings.email ? (
            <li>
              <a href={`mailto:${settings.email}`} className="underline decoration-line underline-offset-4">
                {settings.email}
              </a>
            </li>
          ) : null}
          {instagram ? (
            <li>
              <a href={instagram} className="underline decoration-line underline-offset-4" target="_blank" rel="noreferrer">
                {instagramLabel(settings.instagram)}
              </a>
            </li>
          ) : null}
          {settings.socialLinks.map((link) => (
            <li key={link.url}>
              <a href={link.url} className="underline decoration-line underline-offset-4" target="_blank" rel="noreferrer">
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-12 max-w-md text-lg leading-8 text-mute">El contacto todavía no está publicado.</p>
      )}
    </div>
  )
}
