"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import type { GalleryPhoto } from "@/types/content"
import { formatDateLabel, metaLine } from "@/utils/format"

export function PhotoViewer({
  photos,
  variant = "stack",
}: {
  photos: GalleryPhoto[]
  variant?: "stack" | "masonry"
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const touchStart = useRef<number | null>(null)
  const returnFocus = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (openIndex === null) {
      return
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    closeRef.current?.focus()

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenIndex(null)
      }

      if (event.key === "ArrowRight") {
        setOpenIndex((current) => (current === null ? current : (current + 1) % photos.length))
      }

      if (event.key === "ArrowLeft") {
        setOpenIndex((current) =>
          current === null ? current : (current - 1 + photos.length) % photos.length,
        )
      }

      if (event.key === "Tab" && dialogRef.current) {
        const focusable = Array.from(
          dialogRef.current.querySelectorAll<HTMLElement>("button, [href], [tabindex]:not([tabindex='-1'])"),
        ).filter((element) => !element.hasAttribute("disabled"))
        const first = focusable[0]
        const last = focusable[focusable.length - 1]

        if (!first || !last) {
          return
        }

        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener("keydown", onKey)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener("keydown", onKey)
      returnFocus.current?.focus()
    }
  }, [openIndex, photos.length])

  const active = openIndex === null ? null : photos[openIndex]

  return (
    <>
      <ol className={variant === "masonry" ? "columns-1 gap-3.5 sm:columns-2 lg:columns-3 lg:gap-[22px]" : "flex flex-col gap-16 md:gap-24"}>
        {photos.map((photo, index) => {
          const landscape = photo.width >= photo.height
          const meta = metaLine([photo.location, formatDateLabel(photo.takenAt)])
          const privateImage = photo.src.includes("/object/sign/")
          const image =
            privateImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photo.src}
                alt={photo.alt}
                width={photo.width}
                height={photo.height}
                className="h-auto w-full"
              />
            ) : (
              <Image
                src={photo.src}
                alt={photo.alt}
                width={photo.width}
                height={photo.height}
                sizes={
                  variant === "masonry"
                    ? "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    : landscape
                      ? "(min-width: 1400px) 1400px, 100vw"
                      : "(min-width: 760px) 760px, 100vw"
                }
                priority={variant === "masonry" && index < 3}
                className={variant === "masonry" ? "h-auto w-full transition-opacity duration-200 hover:opacity-90" : "h-auto w-full"}
              />
            )

          return (
            <li
              key={photo.id}
              className={
                variant === "masonry"
                  ? "mb-3.5 break-inside-avoid lg:mb-[22px]"
                  : landscape
                    ? "mx-auto w-full max-w-[1400px]"
                    : "mx-auto w-full max-w-[760px]"
              }
            >
              <figure>
                <button
                  type="button"
                  className="block w-full cursor-zoom-in"
                  onClick={(event) => {
                    returnFocus.current = event.currentTarget
                    setOpenIndex(index)
                  }}
                  aria-haspopup="dialog"
                  aria-label={`Ampliar: ${photo.alt}`}
                >
                  {image}
                </button>
                {variant === "stack" && (photo.caption || meta) ? (
                  <figcaption className="mt-3 flex max-w-xl flex-col gap-1 text-sm leading-6">
                    {photo.caption ? <span>{photo.caption}</span> : null}
                    {meta ? <span className="text-[0.72rem] uppercase tracking-[0.14em] text-mute">{meta}</span> : null}
                  </figcaption>
                ) : null}
              </figure>
            </li>
          )
        })}
      </ol>

      {active && openIndex !== null ? (
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label={active.alt}
          className="fixed inset-0 z-50 flex flex-col bg-[#111] text-[#f5f4f0]"
          onTouchStart={(event) => {
            touchStart.current = event.changedTouches[0]?.clientX ?? null
          }}
          onTouchEnd={(event) => {
            const start = touchStart.current
            const end = event.changedTouches[0]?.clientX

            if (start == null || end == null) {
              return
            }

            const delta = end - start

            if (delta < -48) {
              setOpenIndex((openIndex + 1) % photos.length)
            } else if (delta > 48) {
              setOpenIndex((openIndex - 1 + photos.length) % photos.length)
            }
          }}
        >
          <div className="flex items-center justify-between px-4 py-4 md:px-8">
            <p className="text-[0.72rem] uppercase tracking-[0.16em] text-[#f5f4f0]/70">
              {openIndex + 1} / {photos.length}
            </p>
            <button ref={closeRef} type="button" className="text-[0.72rem] uppercase tracking-[0.16em]" onClick={() => setOpenIndex(null)}>
              Cerrar
            </button>
          </div>
          <div className="flex min-h-0 flex-1 items-center justify-center px-4">
            {active.src.includes("/object/sign/") ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={active.src}
                alt={active.alt}
                className="max-h-[72vh] w-auto max-w-full object-contain"
              />
            ) : (
              <Image
                src={active.src}
                alt={active.alt}
                width={active.width}
                height={active.height}
                sizes="100vw"
                className="h-auto max-h-[72vh] w-auto max-w-full object-contain"
                priority
              />
            )}
          </div>
          <div className="grid gap-4 px-4 py-5 md:grid-cols-[1fr_auto_1fr] md:items-end md:px-8">
            <button
              type="button"
              className="justify-self-start text-[0.72rem] uppercase tracking-[0.16em]"
              onClick={() => setOpenIndex((openIndex - 1 + photos.length) % photos.length)}
            >
              Anterior
            </button>
            <div className="max-w-xl text-center md:justify-self-center">
              <p className="text-sm leading-6">{active.caption || active.alt}</p>
              {active.seriesSlug ? (
                <Link
                  href={`/portfolio/${active.seriesSlug}`}
                  className="mt-3 inline-block text-[0.72rem] uppercase tracking-[0.16em] underline underline-offset-4"
                >
                  Ver la serie
                </Link>
              ) : null}
            </div>
            <button
              type="button"
              className="justify-self-end text-[0.72rem] uppercase tracking-[0.16em]"
              onClick={() => setOpenIndex((openIndex + 1) % photos.length)}
            >
              Siguiente
            </button>
          </div>
        </div>
      ) : null}
    </>
  )
}
