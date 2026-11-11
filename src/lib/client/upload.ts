import { createClient } from "@/lib/supabase/client"
import { getSupabaseEnv } from "@/lib/supabase/env"

function readStorageError(body: string) {
  try {
    const parsed = JSON.parse(body) as { message?: string; error?: string }
    return parsed.message || parsed.error || "No se pudo subir el archivo."
  } catch {
    return "No se pudo subir el archivo."
  }
}

export function uploadOriginal(
  signedUrl: string,
  file: File,
  onProgress: (value: number) => void,
) {
  const env = getSupabaseEnv()

  return new Promise<void>((resolve, reject) => {
    const body = new FormData()
    body.append("cacheControl", "3600")
    body.append("", file, file.name)

    const xhr = new XMLHttpRequest()
    xhr.open("PUT", signedUrl)

    if (env?.key) {
      xhr.setRequestHeader("apikey", env.key)
    }

    xhr.setRequestHeader("x-upsert", "false")

    void createClient()
      .auth.getSession()
      .then(({ data }) => {
        const accessToken = data.session?.access_token

        if (accessToken) {
          xhr.setRequestHeader("Authorization", `Bearer ${accessToken}`)
        } else if (env?.key) {
          xhr.setRequestHeader("Authorization", `Bearer ${env.key}`)
        }

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            onProgress(Math.round((event.loaded / event.total) * 100))
          }
        }

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            onProgress(100)
            resolve()
            return
          }

          reject(new Error(readStorageError(xhr.responseText)))
        }

        xhr.onerror = () => reject(new Error("La subida se interrumpió."))
        xhr.send(body)
      })
      .catch(() => reject(new Error("No se pudo preparar la subida.")))
  })
}
