import type { Metadata } from "next"
import { Suspense } from "react"
import { connection } from "next/server"
import { Footer } from "@/components/public/Footer"
import { Header, HeaderFallback } from "@/components/public/Header"
import { getSiteSettings } from "@/lib/data/public"

export async function generateMetadata(): Promise<Metadata> {
  await connection()
  const settings = await getSiteSettings()
  const name = settings.photographerName || "Portfolio"
  const title = settings.seoTitle || name
  const description = settings.seoDescription || settings.profession

  return {
    title: {
      default: title,
      template: `%s · ${name}`,
    },
    description,
    openGraph: {
      title,
      description,
      locale: "es_AR",
      type: "website",
      images: settings.featuredImageUrl ? [{ url: settings.featuredImageUrl }] : undefined,
    },
  }
}

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#contenido"
        className="absolute left-4 top-4 z-50 -translate-y-24 bg-paper px-3 py-2 text-sm focus:translate-y-0"
      >
        Saltar al contenido
      </a>
      <Suspense fallback={<HeaderFallback />}>
        <Header />
      </Suspense>
      <main id="contenido" className="flex-1">
        {children}
      </main>
      <Suspense fallback={null}>
        <Footer />
      </Suspense>
    </div>
  )
}
