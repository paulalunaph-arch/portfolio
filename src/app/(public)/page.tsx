import { Suspense } from "react"
import { connection } from "next/server"
import { PhotoViewer } from "@/components/public/PhotoViewer"
import { getHomeSelection, getSiteSettings } from "@/lib/data/public"

export default function HomePage() {
  return (
    <Suspense fallback={<p className="px-5 py-20 text-sm text-mute md:px-10">Cargando…</p>}>
      <HomeContent />
    </Suspense>
  )
}

async function HomeContent() {
  await connection()
  const [settings, photos] = await Promise.all([getSiteSettings(), getHomeSelection()])
  const name = settings.photographerName || "Paula Luna"

  return (
    <div className="px-5 md:px-10 lg:px-11">
      <header className="border-b border-line pb-12 pt-14 md:pb-[50px] md:pt-16">
        <p className="text-[11px] uppercase tracking-[0.18em] text-mute">Fotografía seleccionada</p>
        <h1 className="mt-[18px] font-serif text-[clamp(3.25rem,6vw,5.5rem)] leading-[0.92] tracking-[-0.045em]">
          Portfolio
        </h1>
        <p className="mt-[18px] max-w-[1040px] text-[17px] leading-[1.55] text-mute">
          Selección de fotografías documentales de {name}, de proyectos de largo aliento y encargos.
        </p>
      </header>
      <div className="py-12 lg:py-16">
        {photos.length === 0 ? (
          <p className="max-w-md text-lg leading-8 text-mute">
            La selección del inicio se elige desde el estudio.
          </p>
        ) : (
          <PhotoViewer photos={photos} variant="masonry" />
        )}
      </div>
    </div>
  )
}
