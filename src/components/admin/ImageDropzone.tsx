"use client"

import { useRef, useState } from "react"
import { buttonClass } from "@/components/ui/controls"
import { filesFromDrop, filesFromList } from "@/lib/client/image-files"

const accept = "image/jpeg,image/png,image/webp,image/tiff,.jpg,.jpeg,.png,.webp,.tif,.tiff"

export function ImageDropzone({
  multiple = false,
  buttonLabel,
  hint,
  busy = false,
  onFiles,
}: {
  multiple?: boolean
  buttonLabel: string
  hint: string
  busy?: boolean
  onFiles: (files: File[]) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  async function take(files: File[]) {
    const images = multiple ? files : files.slice(0, 1)

    if (images.length === 0) {
      setNotice("Solo se pueden agregar JPEG, PNG, WebP o TIFF.")
      return
    }

    setNotice(null)
    onFiles(images)
  }

  return (
    <div
      className={`mt-6 border border-dashed px-5 py-6 ${dragging ? "border-ink" : "border-line"}`}
      onDragOver={(event) => {
        event.preventDefault()
        setDragging(true)
      }}
      onDragLeave={(event) => {
        if (event.currentTarget.contains(event.relatedTarget as Node | null)) {
          return
        }

        setDragging(false)
      }}
      onDrop={(event) => {
        event.preventDefault()
        setDragging(false)
        void filesFromDrop(event.dataTransfer).then((files) => take(files))
      }}
    >
      <button type="button" className={buttonClass} disabled={busy} onClick={() => inputRef.current?.click()}>
        {busy ? "Subiendo…" : buttonLabel}
      </button>
      <p className="mt-4 max-w-xl text-sm leading-6 text-mute">{hint}</p>
      {notice ? <p className="mt-3 text-sm text-danger">{notice}</p> : null}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="sr-only"
        onChange={(event) => {
          const files = filesFromList(event.target.files)
          event.target.value = ""
          void take(files)
        }}
      />
    </div>
  )
}
