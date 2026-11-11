"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { ImageDropzone } from "@/components/admin/ImageDropzone"
import { prepareSiteUpload } from "@/lib/actions/photographs"
import { finalizeSiteUpload, removeSiteImage } from "@/lib/actions/settings"
import { uploadOriginal } from "@/lib/client/upload"
import { dangerButtonClass } from "@/components/ui/controls"
import { formatBytes } from "@/utils/format"

export function AssetUploader({
  kind,
  label,
  description,
  url,
  width,
  height,
  bytes,
}: {
  kind: "portrait" | "featured"
  label: string
  description: string
  url: string | null
  width: number | null
  height: number | null
  bytes: number | null
}) {
  const router = useRouter()
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [pending, startTransition] = useTransition()

  async function onFile(file: File | undefined) {
    if (!file) {
      return
    }

    setError(null)
    setUploading(true)
    setStatus("Subiendo")
    setProgress(0)

    const prepared = await prepareSiteUpload({
      name: file.name,
      type: file.type,
      size: file.size,
    })

    if ("error" in prepared) {
      setUploading(false)
      setStatus(null)
      setError(prepared.error)
      return
    }

    try {
      await uploadOriginal(prepared.signedUrl, file, setProgress)
      setStatus("Optimizando")
      const result = await finalizeSiteUpload({ kind, assetId: prepared.assetId })

      if ("error" in result) {
        setUploading(false)
        setStatus(null)
        setError(result.error)
        return
      }

      setStatus(
        `${formatBytes(result.originalBytes)} → ${formatBytes(result.optimizedBytes)} · ${result.reduction}% menos · ${result.width} × ${result.height} px`,
      )
      router.refresh()
    } catch (uploadError) {
      setStatus(null)
      setError(uploadError instanceof Error ? uploadError.message : "No se pudo subir la imagen.")
    } finally {
      setUploading(false)
    }
  }

  return (
    <section className="border-t border-line py-8">
      <h2 className="font-serif text-3xl tracking-tight">{label}</h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-mute">{description}</p>
      {url && width && height ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" width={width} height={height} className="mt-5 h-auto max-w-sm" />
      ) : (
        <p className="mt-4 text-sm text-mute">Todavía no hay imagen.</p>
      )}
      {bytes ? <p className="mt-2 text-xs text-mute">{formatBytes(bytes)} optimizados</p> : null}
      <ImageDropzone
        busy={uploading}
        buttonLabel={url ? "Cambiar imagen" : "Agregar imagen"}
        hint="El botón abre tus carpetas. También podés arrastrar la imagen desde una carpeta y soltarla en este recuadro. JPEG, PNG, WebP o TIFF."
        onFiles={(files) => {
          void onFile(files[0])
        }}
      />
      {progress > 0 && progress < 100 ? <p className="mt-3 text-sm">Subiendo {progress}%</p> : null}
      {status ? <p className="mt-3 text-sm">{status}</p> : null}
      {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
      {url ? (
        <button
          type="button"
          className={`${dangerButtonClass} mt-4`}
          disabled={pending}
          onClick={() => {
            startTransition(async () => {
              const result = await removeSiteImage(kind)
              if ("error" in result && result.error) {
                setError(result.error)
                return
              }
              setStatus("Imagen quitada.")
              router.refresh()
            })
          }}
        >
          Quitar imagen
        </button>
      ) : null}
      <p className="mt-4 text-sm text-mute">Se guarda una sola versión WebP, con un máximo de 2000 px.</p>
    </section>
  )
}
