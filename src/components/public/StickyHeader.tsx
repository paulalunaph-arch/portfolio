"use client"

import { useEffect, useState } from "react"

export function StickyHeader({ children }: { children: React.ReactNode }) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      const next = window.scrollY > 4
      setScrolled((current) => (current === next ? current : next))
    }

    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <header
      className={`sticky top-0 z-30 border-b transition-[background-color,border-color] duration-300 ${
        scrolled ? "border-transparent bg-transparent" : "border-line bg-paper"
      }`}
    >
      {children}
    </header>
  )
}
