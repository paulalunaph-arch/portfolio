import Link from "next/link"
import { connection } from "next/server"
import { MobileNav } from "@/components/public/MobileNav"
import { StickyHeader } from "@/components/public/StickyHeader"
import { getSiteSettings } from "@/lib/data/public"

const links = [
  { href: "/portfolio", label: "Portfolio" },
  { href: "/sobre-mi", label: "Sobre mí" },
  { href: "/contacto", label: "Contacto" },
]

export async function Header() {
  await connection()
  const settings = await getSiteSettings()
  const name = settings.photographerName || "Portfolio"

  return (
    <StickyHeader>
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-6 px-5 py-5 md:px-10 lg:px-16">
        <Link href="/" className="font-serif text-xl tracking-tight">
          {name}
        </Link>
        <nav className="hidden items-center gap-8 md:flex" aria-label="Principal">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[0.72rem] uppercase tracking-[0.18em] text-ink"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <MobileNav name={name} links={links} />
      </div>
    </StickyHeader>
  )
}

export function HeaderFallback() {
  return <div className="sticky top-0 z-30 h-[73px] border-b border-line bg-paper" />
}
