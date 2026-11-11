"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { logout } from "@/lib/actions/auth"

const links = [
  { href: "/admin/dashboard", label: "Panel" },
  { href: "/admin/series", label: "Categorías" },
  { href: "/admin/configuracion", label: "Configuración" },
]

export function AdminNav({ email }: { email: string | null }) {
  const pathname = usePathname()

  return (
    <>
      <div className="flex items-center justify-between border-b border-line px-5 py-4 md:hidden">
        <Link href="/admin/dashboard" className="text-[0.72rem] uppercase tracking-[0.18em]">
          Estudio
        </Link>
        <details>
          <summary className="cursor-pointer text-[0.72rem] uppercase tracking-[0.16em]">Menú</summary>
          <div className="mt-4 flex flex-col gap-3">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className="text-sm">
                {link.label}
              </Link>
            ))}
            <Link href="/" className="text-sm text-mute">
              Ver sitio
            </Link>
            <form action={logout}>
              <button type="submit" className="text-sm">
                Cerrar sesión
              </button>
            </form>
          </div>
        </details>
      </div>
      <aside className="hidden w-60 shrink-0 border-r border-line md:flex md:min-h-screen md:flex-col md:justify-between md:px-6 md:py-8">
        <div>
          <Link href="/admin/dashboard" className="text-[0.72rem] uppercase tracking-[0.2em]">
            Estudio
          </Link>
          <nav className="mt-10 flex flex-col gap-3" aria-label="Estudio">
            {links.map((link) => {
              const active = pathname === link.href || pathname.startsWith(`${link.href}/`)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={active ? "text-sm" : "text-sm text-mute"}
                >
                  {link.label}
                </Link>
              )
            })}
          </nav>
        </div>
        <div className="flex flex-col gap-4 text-sm">
          {email ? <p className="break-all text-mute">{email}</p> : null}
          <Link href="/" className="underline decoration-line underline-offset-4">
            Ver sitio
          </Link>
          <form action={logout}>
            <button type="submit" className="underline decoration-line underline-offset-4">
              Cerrar sesión
            </button>
          </form>
        </div>
      </aside>
    </>
  )
}
