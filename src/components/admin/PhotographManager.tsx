"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState, useTransition } from "react"
import {
  deletePhotograph,
  reorderPhotographs,
  savePhotographs,
  setCover,
} from "@/lib/actions/photographs"
import { buttonClass, dangerButtonClass, fieldClass, labelClass, quietButtonClass } from "@/components/ui/controls"
import { Hint } from "@/components/ui/Hint"
import { useUnsavedChanges } from "@/components/admin/useUnsavedChanges"
import type { AdminPhotograph } from "@/types/content"
import { reductionPercent } from "@/lib/validations/content"
import { formatBytes } from "@/utils/format"

function snapshot(photos: AdminPhotograph[]) {
  return photos.map((photo) => ({
    id: photo.id,
    caption: photo.caption,
    altText: photo.altText,
    location: photo.location,
    takenAt: photo.takenAt,
    published: photo.published,
    homeSelected: photo.homeSelected,
  }))
}

export function PhotographManager({
  seriesId,
  coverId,
  photos,
}: {
  seriesId: string
  coverId: string | null
  photos: AdminPhotograph[]
}) {
  const router = useRouter()
  const [items, setItems] = useState(photos)
  const [baseline, setBaseline] = useState(() => snapshot(photos))
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)
  const [dragging, setDragging] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const dirty = items.some((item) => {
    const base = baseline.find((entry) => entry.id === item.id)

    if (!base) {
      return false
    }

    return (
      base.caption !== item.caption ||
      base.altText !== item.altText ||
      base.location !== item.location ||
      base.takenAt !== item.takenAt ||
      base.published !== item.published ||
      base.homeSelected !== item.homeSelected
    )
  })

  useUnsavedChanges(dirty)

  useEffect(() => {
    setItems((current) => {
      const byId = new Map(current.map((item) => [item.id, item]))

      return photos.map((photo) => {
        const local = byId.get(photo.id)

        if (!local) {
          return photo
        }

        return {
          ...photo,
          caption: local.caption,
          altText: local.altText,
          location: local.location,
          takenAt: local.takenAt,
          published: local.published,
          homeSelected: local.homeSelected,
        }
      })
    })
    setBaseline((current) => {
      const ids = new Set(photos.map((photo) => photo.id))
      const known = new Set(current.map((item) => item.id))

      return [
        ...current.filter((item) => ids.has(item.id)),
        ...snapshot(photos).filter((item) => !known.has(item.id)),
      ]
    })
  }, [photos])

  function replace(next: AdminPhotograph[]) {
    setItems(next)
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction

    if (target < 0 || target >= items.length) {
      return
    }

    const next = [...items]
    const [item] = next.splice(index, 1)
    next.splice(target, 0, item)
    replace(next)
    persistOrder(next)
  }

  function persistOrder(next: AdminPhotograph[]) {
    startTransition(async () => {
      const result = await reorderPhotographs(
        seriesId,
        next.map((item) => item.id),
      )
      if ("error" in result && result.error) {
        setError(result.error)
        return
      }
      setError(null)
      setMessage("Orden actualizado.")
      router.refresh()
    })
  }

  return (
    <section className="mt-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-serif text-3xl tracking-tight">Fotografías</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-mute">
            El orden de esta lista es el orden dentro de la categoría. Portada es la foto que se ve en el portfolio,
            antes de entrar. Guardar epígrafes confirma textos, fechas y las dos casillas.
          </p>
        </div>
        <p className="text-sm text-mute">{items.length} en la categoría</p>
      </div>
      {items.length === 0 ? (
        <p className="mt-6 text-sm text-mute">Todavía no hay fotografías en esta categoría.</p>
      ) : (
        <form
          className="mt-6"
          onSubmit={(event) => {
            event.preventDefault()
            startTransition(async () => {
              const result = await savePhotographs(
                seriesId,
                items.map((item) => ({
                  id: item.id,
                  caption: item.caption,
                  altText: item.altText,
                  location: item.location,
                  takenAt: item.takenAt,
                  published: item.published,
                  homeSelected: item.homeSelected,
                })),
              )
              if ("error" in result && result.error) {
                setError(result.error)
                setMessage(null)
                return
              }
              setError(null)
              setBaseline(snapshot(items))
              setMessage("ok" in result ? result.ok ?? "Cambios guardados." : "Cambios guardados.")
              router.refresh()
            })
          }}
        >
          <ol className="flex flex-col gap-8">
            {items.map((photo, index) => {
              const saving =
                photo.originalFileSizeBytes && photo.fileSizeBytes
                  ? reductionPercent(photo.originalFileSizeBytes, photo.fileSizeBytes)
                  : null

              return (
                <li
                  key={photo.id}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => {
                    if (!dragging || dragging === photo.id) {
                      return
                    }
                    const from = items.findIndex((item) => item.id === dragging)
                    const next = [...items]
                    const [moved] = next.splice(from, 1)
                    next.splice(index, 0, moved)
                    setDragging(null)
                    replace(next)
                    persistOrder(next)
                  }}
                  className="grid gap-5 border-t border-line pt-6 lg:grid-cols-[180px_1fr]"
                >
                  <div>
                    {photo.displayUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={photo.displayUrl} alt={photo.altText || photo.caption || "Fotografía"} className="h-auto w-full" />
                    ) : (
                      <div className="flex min-h-28 items-end border border-line p-3 text-sm text-mute">Sin vista previa</div>
                    )}
                    <p className="mt-3 text-xs text-mute">
                      {photo.width && photo.height ? `${photo.width} × ${photo.height} px` : "Sin medidas"}
                      {" · "}
                      {formatBytes(photo.fileSizeBytes)}
                    </p>
                    {saving !== null ? (
                      <p className="mt-1 text-xs text-mute">
                        {formatBytes(photo.originalFileSizeBytes)} originales · {saving}% menos
                      </p>
                    ) : null}
                    <p className="mt-2 text-[0.68rem] uppercase tracking-[0.14em] text-mute">
                      {photo.storageBucket === "portfolio" ? "Pública" : "Privada"}
                    </p>
                  </div>
                  <div className="grid gap-4">
                    <div>
                      <label className={labelClass} htmlFor={`caption-${photo.id}`}>
                        Epígrafe
                      </label>
                      <textarea
                        id={`caption-${photo.id}`}
                        rows={3}
                        value={photo.caption}
                        onChange={(event) => {
                          const caption = event.target.value
                          replace(items.map((item) => (item.id === photo.id ? { ...item, caption } : item)))
                        }}
                        className={`${fieldClass} mt-2`}
                      />
                      <Hint>El texto que se lee al abrir la foto. Puede contar el contexto. Si lo dejás vacío, la foto se abre sin texto.</Hint>
                    </div>
                    <div>
                      <label className={labelClass} htmlFor={`alt-${photo.id}`}>
                        Texto alternativo
                      </label>
                      <input
                        id={`alt-${photo.id}`}
                        value={photo.altText}
                        onChange={(event) => {
                          const altText = event.target.value
                          replace(items.map((item) => (item.id === photo.id ? { ...item, altText } : item)))
                        }}
                        className={`${fieldClass} mt-2`}
                      />
                      <Hint>Describe la imagen para quien no puede verla. Si queda vacío, se usa el epígrafe.</Hint>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className={labelClass} htmlFor={`location-${photo.id}`}>
                          Ubicación
                        </label>
                        <input
                          id={`location-${photo.id}`}
                          value={photo.location}
                          onChange={(event) => {
                            const location = event.target.value
                            replace(items.map((item) => (item.id === photo.id ? { ...item, location } : item)))
                          }}
                          className={`${fieldClass} mt-2`}
                        />
                        <Hint>El lugar de esta foto. Aparece al abrirla. Si no aplica, dejalo vacío.</Hint>
                      </div>
                      <div>
                        <label className={labelClass} htmlFor={`taken-${photo.id}`}>
                          Fecha
                        </label>
                        <input
                          id={`taken-${photo.id}`}
                          type="date"
                          value={photo.takenAt}
                          onChange={(event) => {
                            const takenAt = event.target.value
                            replace(items.map((item) => (item.id === photo.id ? { ...item, takenAt } : item)))
                          }}
                          className={`${fieldClass} mt-2`}
                        />
                        <Hint>El día en que se hizo. Se muestra como día.mes.año al abrir la foto.</Hint>
                      </div>
                    </div>
                    <div>
                      <label className="flex items-center gap-3 text-sm">
                        <input
                          type="checkbox"
                          checked={photo.published}
                          onChange={(event) => {
                            const published = event.target.checked
                            replace(items.map((item) => (item.id === photo.id ? { ...item, published } : item)))
                          }}
                          className="size-4 accent-ink"
                        />
                        Publicada dentro de la categoría
                      </label>
                      <Hint>Si está marcada, la foto se ve en la categoría publicada. Si no, queda guardada pero oculta.</Hint>
                    </div>
                    <div>
                      <label className="flex items-center gap-3 text-sm">
                        <input
                          type="checkbox"
                          checked={photo.homeSelected}
                          onChange={(event) => {
                            const homeSelected = event.target.checked
                            replace(items.map((item) => (item.id === photo.id ? { ...item, homeSelected } : item)))
                          }}
                          className="size-4 accent-ink"
                        />
                        Incluir en la selección del inicio
                      </label>
                      <Hint>
                        Aparece en la portada solo si la fotografía y la categoría están publicadas. El orden es el de las
                        marcas: para llevar una foto al final, hay que desmarcarla y volver a marcarla.
                      </Hint>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        draggable
                        aria-label={`Arrastrar ${photo.altText || photo.caption || "fotografía"}`}
                        className={quietButtonClass}
                        onDragStart={() => setDragging(photo.id)}
                        onDragEnd={() => setDragging(null)}
                      >
                        Arrastrar
                      </button>
                      <button type="button" className={quietButtonClass} onClick={() => move(index, -1)} disabled={index === 0 || pending}>
                        Subir
                      </button>
                      <button
                        type="button"
                        className={quietButtonClass}
                        onClick={() => move(index, 1)}
                        disabled={index === items.length - 1 || pending}
                      >
                        Bajar
                      </button>
                      <button
                        type="button"
                        className={quietButtonClass}
                        disabled={pending || coverId === photo.id}
                        onClick={() => {
                          startTransition(async () => {
                            const result = await setCover(seriesId, photo.id)
                            if ("error" in result && result.error) {
                              setError(result.error)
                              return
                            }
                            setError(null)
                            setMessage("Portada actualizada.")
                            router.refresh()
                          })
                        }}
                      >
                        {coverId === photo.id ? "Portada" : "Usar como portada"}
                      </button>
                      {pendingDelete === photo.id ? (
                        <>
                          <button
                            type="button"
                            className={dangerButtonClass}
                            disabled={pending}
                            onClick={() => {
                              startTransition(async () => {
                                const result = await deletePhotograph(seriesId, photo.id)
                                if ("error" in result && result.error) {
                                  setError(result.error)
                                  return
                                }
                                setPendingDelete(null)
                                setError(null)
                                setMessage("Fotografía eliminada.")
                                setBaseline((current) => current.filter((item) => item.id !== photo.id))
                                replace(items.filter((item) => item.id !== photo.id))
                                router.refresh()
                              })
                            }}
                          >
                            Confirmar eliminación
                          </button>
                          <button type="button" className={quietButtonClass} onClick={() => setPendingDelete(null)}>
                            Cancelar
                          </button>
                        </>
                      ) : (
                        <button type="button" className={dangerButtonClass} onClick={() => setPendingDelete(photo.id)}>
                          Eliminar
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-mute">También se puede arrastrar la fila para cambiar el orden.</p>
                  </div>
                </li>
              )
            })}
          </ol>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <button type="submit" className={buttonClass} disabled={pending}>
              {pending ? "Guardando…" : "Guardar epígrafes"}
            </button>
            {message ? <p role="status">{message}</p> : null}
            {error ? (
              <p role="alert" className="text-danger">
                {error}
              </p>
            ) : null}
          </div>
        </form>
      )}
    </section>
  )
}
