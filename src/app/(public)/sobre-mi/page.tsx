import type { Metadata } from "next"
import Image from "next/image"
import { Suspense } from "react"
import { connection } from "next/server"
import { getSiteSettings } from "@/lib/data/public"

export const metadata: Metadata = {
  title: "Sobre mí",
}

export default function AboutPage() {
  return (
    <Suspense fallback={<p className="px-5 py-20 text-sm text-mute">Cargando…</p>}>
      <AboutContent />
    </Suspense>
  )
}

async function AboutContent() {
  await connection()
  const settings = await getSiteSettings()
  const sections = [
    ["Biografía", settings.biography],
    ["Formación", settings.education],
    ["Intereses", settings.interests],
    ["Mirada", settings.authorStatement],
  ].filter(([, text]) => text.trim())
  const hasPortrait = Boolean(settings.portraitUrl && settings.portraitWidth && settings.portraitHeight)

  return (
    <div className="mx-auto grid max-w-[1600px] gap-12 px-5 py-14 md:px-10 md:py-20 lg:grid-cols-12 lg:px-16">
      <div className="lg:col-span-5">
        {hasPortrait ? (
          <Image
            src={settings.portraitUrl as string}
            alt={settings.portraitAlt || settings.photographerName || "Retrato"}
            width={settings.portraitWidth as number}
            height={settings.portraitHeight as number}
            sizes="(min-width: 1024px) 38vw, 100vw"
            className="h-auto w-full"
            priority
          />
        ) : (
          <div className="flex min-h-80 items-end border border-line p-5">
            <p className="text-sm text-mute">Retrato pendiente.</p>
          </div>
        )}
      </div>
      <div className="lg:col-span-6 lg:col-start-7">
        <p className="text-[0.72rem] uppercase tracking-[0.18em] text-mute">Sobre mí</p>
        <h1 className="mt-4 font-serif text-5xl tracking-tight md:text-6xl">
          {settings.photographerName || "Portfolio"}
        </h1>
        <p className="mt-4 text-[0.72rem] uppercase tracking-[0.16em] text-mute">{settings.profession}</p>
        {sections.length === 0 ? (
          <p className="mt-10 text-lg leading-8 text-mute">La biografía todavía no está publicada.</p>
        ) : (
          <div className="mt-10 flex flex-col gap-10">
            {sections.map(([title, text]) => (
              <section key={title}>
                <h2 className="text-[0.72rem] uppercase tracking-[0.16em] text-mute">{title}</h2>
                <p className="mt-3 max-w-xl whitespace-pre-line text-lg leading-8">{text}</p>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
