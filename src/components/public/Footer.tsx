import Link from "next/link"
import { connection } from "next/server"
import { getSiteSettings } from "@/lib/data/public"
import { instagramHref, instagramLabel } from "@/utils/format"

export async function Footer() {
  await connection()
  const settings = await getSiteSettings()
  const name = settings.photographerName || "Portfolio"
  const instagram = instagramHref(settings.instagram)

  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-x-8 gap-y-2 px-5 py-4 text-[0.72rem] uppercase tracking-[0.14em] text-mute md:px-10 lg:px-11">
        <p>{name}</p>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          {settings.email ? (
            <a href={`mailto:${settings.email}`} className="underline decoration-line underline-offset-4">
              {settings.email}
            </a>
          ) : null}
          {instagram ? (
            <a href={instagram} className="underline decoration-line underline-offset-4" target="_blank" rel="noreferrer">
              {instagramLabel(settings.instagram)}
            </a>
          ) : null}
          {settings.socialLinks.map((link) => (
            <a key={link.url} href={link.url} className="underline decoration-line underline-offset-4" target="_blank" rel="noreferrer">
              {link.label}
            </a>
          ))}
          <Link href="/contacto" className="underline decoration-line underline-offset-4">
            Contacto
          </Link>
        </div>
      </div>
    </footer>
  )
}
