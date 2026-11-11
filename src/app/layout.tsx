import type { CSSProperties } from "react"
import type { Metadata, Viewport } from "next"
import { Geist, Newsreader } from "next/font/google"
import { getSiteSettings } from "@/lib/data/public"
import { getSiteUrl } from "@/lib/supabase/env"
import "./globals.css"

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
})

const newsreader = Newsreader({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-newsreader",
  display: "swap",
})

const siteUrl = getSiteUrl()

export const metadata: Metadata = {
  metadataBase: siteUrl ? new URL(siteUrl) : undefined,
  title: {
    default: "Portfolio",
    template: "%s",
  },
  description: "Portfolio de fotoperiodismo y fotografía documental.",
  robots: {
    index: true,
    follow: true,
  },
}

export async function generateViewport(): Promise<Viewport> {
  const settings = await getSiteSettings()

  return { themeColor: settings.colorBackground }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettings()
  const theme = {
    "--paper": settings.colorBackground,
    "--ink": settings.colorText,
    "--mute": settings.colorMuted,
    "--line": settings.colorLine,
  } as CSSProperties

  return (
    <html lang="es" style={theme} className={`${geist.variable} ${newsreader.variable} h-full antialiased`}>
      <body className="min-h-full bg-paper text-ink">{children}</body>
    </html>
  )
}
