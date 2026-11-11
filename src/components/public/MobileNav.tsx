"use client"

import Link from "next/link"
import { useEffect, useId, useState } from "react"

type NavLink = {
  href: string
  label: string
}

export function MobileNav({ name, links }: { name: string; links: NavLink[] }) {
  const [open, setOpen] = useState(false)
  const titleId = useId()

  useEffect(() => {
    if (!open) {
      return
    }

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false)
      }
    }

    const previous = document.body.style.overflow
    document.body.style.overflow = "hidden"
    document.addEventListener("keydown", onKey)

    return () => {
      document.body.style.overflow = previous
      document.removeEventListener("keydown", onKey)
    }
  }, [open])

  return (
    <div className="md:hidden">
      <button
        type="button"
        className="text-[0.72rem] uppercase tracking-[0.18em]"
        aria-expanded={open}
        aria-controls={titleId}
        onClick={() => setOpen(true)}
      >
        Menú
      </button>
      {open ? (
        <div className="fixed inset-0 z-40 flex flex-col bg-paper px-5 py-5" role="dialog" aria-modal="true" aria-labelledby={titleId}>
          <div className="flex items-center justify-between">
            <p id={titleId} className="font-serif text-xl">
              {name}
            </p>
            <button type="button" className="text-[0.72rem] uppercase tracking-[0.18em]" onClick={() => setOpen(false)}>
              Cerrar
            </button>
          </div>
          <nav className="mt-16 flex flex-col gap-6" aria-label="Principal">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="font-serif text-4xl tracking-tight"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      ) : null}
    </div>
  )
}
