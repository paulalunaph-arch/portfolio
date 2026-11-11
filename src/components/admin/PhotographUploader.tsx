"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { ImageDropzone } from "@/components/admin/ImageDropzone"
import { finalizeSeriesUpload, prepareSeriesUpload } from "@/lib/actions/photographs"
import { uploadOriginal } from "@/lib/client/upload"
import { formatBytes } from "@/utils/format"

type UploadItem = {
  key: string
  name: string
  originalBytes: number
  status: "uploading" | "processing" | "done" | "error"
  progress: number
  message?: string
  optimizedBytes?: number
  width?: number
  height?: number
  reduction?: number
}

export function PhotographUploader({ seriesId }: { seriesId: string }) {
  const router = useRouter()
  const [items, setItems] = useState<UploadItem[]>([])
  const [busy, setBusy] = useState(false)

  function update(key: string, patch: Partial<UploadItem>) {
    setItems((current) => current.map((item) => (item.key === key ? { ...item, ...patch } : item)))
  }

  async function uploadFiles(files: File[]) {
    if (files.length === 0 || busy) {
      return
    }

    setBusy(true)
    const queue = files.map((file) => ({
      key: `${file.name}-${file.size}-${file.lastModified}`,
      file,
    }))

    setItems((current) => [
      ...queue.map(({ key, file }) => ({
        key,
        name: file.name,
        originalBytes: file.size,
        status: "uploading" as const,
        progress: 0,
      })),
      ...current,
    ])

    for (const { key, file } of queue) {
      const prepared = await prepareSeriesUpload(seriesId, {
        name: file.name,
        type: file.type,
        size: file.size,
      })

      if ("error" in prepared) {
        update(key, { status: "error", message: prepared.error, progress: 0 })
        continue
      }

      try {
        await uploadOriginal(prepared.signedUrl, file, (progress) => {
          update(key, { status: "uploading", progress })
        })
        update(key, { status: "processing", progress: 100 })
        const result = await finalizeSeriesUpload({
          seriesId,
          photoId: prepared.photoId,
        })

        if ("error" in result) {
          update(key, { status: "error", message: result.error })
          continue
        }

        update(key, {
          status: "done",
          progress: 100,
          optimizedBytes: result.optimizedBytes,
          width: result.width,
          height: result.height,
          reduction: result.reduction,
          originalBytes: result.originalBytes,
        })
      } catch (error) {
        update(key, {
          status: "error",
          message: error instanceof Error ? error.message : "No se pudo subir el archivo.",
        })
      }
    }

    setBusy(false)
    router.refresh()
  }

  return (
    <section className="mt-14">
      <h2 className="font-serif text-3xl tracking-tight">Subir fotografías</h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-mute">
        Las fotos entran a esta categoría. Cada archivo se optimiza en el servidor y el original no queda
        guardado. Después podés escribir el epígrafe y decidir si se publican.
      </p>
      <ImageDropzone
        multiple
        busy={busy}
        buttonLabel="Agregar fotografías"
        hint="El botón abre tus carpetas. También podés arrastrar una o varias fotos, o una carpeta entera, y soltarlas en este recuadro. JPEG, PNG, WebP o TIFF, hasta 20 MB."
        onFiles={(files) => {
          void uploadFiles(files)
        }}
      />
      {items.length > 0 ? (
        <ul className="mt-6 divide-y divide-line border-y border-line">
          {items.map((item) => (
            <li key={item.key} className="grid gap-2 py-4 text-sm md:grid-cols-[1.4fr_1fr_1fr]">
              <div>
                <p className="break-all">{item.name}</p>
                <p className="mt-1 text-mute">
                  {item.status === "uploading"
                    ? `Subiendo ${item.progress}%`
                    : item.status === "processing"
                      ? "Optimizando"
                      : item.status === "done"
                        ? "Lista"
                        : "Error"}
                </p>
              </div>
              <div>
                <div className="h-px w-full bg-line" aria-hidden="true">
                  <div className="h-px bg-ink" style={{ width: `${item.status === "error" ? 0 : item.progress}%` }} />
                </div>
                <p className="mt-2 text-mute">{formatBytes(item.originalBytes)}</p>
              </div>
              <div>
                {item.status === "done" ? (
                  <p>
                    {formatBytes(item.optimizedBytes)} · {item.width} × {item.height} px · {item.reduction}% menos
                  </p>
                ) : null}
                {item.message ? <p className="text-danger">{item.message}</p> : null}
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  )
}
