import "server-only"
import sharp from "sharp"
import { imageConfig } from "@/lib/image-processing/config"

export class ImageProcessError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "ImageProcessError"
  }
}

export type ProcessedImage = {
  buffer: Buffer
  width: number
  height: number
  bytes: number
  format: "webp"
}

type DetectedFormat = "jpeg" | "png" | "webp" | "tiff"

function detectedFormat(buffer: Buffer): DetectedFormat | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "jpeg"
  }

  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return "png"
  }

  if (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "webp"
  }

  if (
    buffer.length >= 4 &&
    ((buffer[0] === 0x49 && buffer[1] === 0x49 && buffer[2] === 0x2a && buffer[3] === 0x00) ||
      (buffer[0] === 0x4d && buffer[1] === 0x4d && buffer[2] === 0x00 && buffer[3] === 0x2a))
  ) {
    return "tiff"
  }

  return null
}

export function assertUploadableImage(buffer: Buffer) {
  if (buffer.byteLength === 0) {
    throw new ImageProcessError("El archivo está vacío.")
  }

  if (buffer.byteLength > imageConfig.maxUploadBytes) {
    throw new ImageProcessError("El archivo supera el máximo de 20 MB.")
  }

  if (!detectedFormat(buffer)) {
    throw new ImageProcessError(
      "El archivo no es un JPEG, PNG, WebP o TIFF válido. Los RAW y HEIC hay que exportarlos antes.",
    )
  }
}

export async function optimizeImage(buffer: Buffer): Promise<ProcessedImage> {
  assertUploadableImage(buffer)

  try {
    const { data, info } = await sharp(buffer, {
      failOn: "error",
      limitInputPixels: imageConfig.maxInputPixels,
      animated: false,
    })
      .rotate()
      .resize({
        width: imageConfig.maxWidth,
        height: imageConfig.maxHeight,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({
        quality: imageConfig.quality,
        effort: imageConfig.effort,
      })
      .toBuffer({ resolveWithObject: true })

    if (!info.width || !info.height) {
      throw new ImageProcessError("No se pudieron leer las dimensiones de la imagen.")
    }

    if (data.byteLength > imageConfig.maxStoredBytes) {
      throw new ImageProcessError(
        "La versión optimizada sigue siendo demasiado pesada. Probá con un archivo más chico.",
      )
    }

    return {
      buffer: data,
      width: info.width,
      height: info.height,
      bytes: data.byteLength,
      format: "webp",
    }
  } catch (error) {
    if (error instanceof ImageProcessError) {
      throw error
    }

    const message = error instanceof Error ? error.message.toLowerCase() : ""

    if (message.includes("pixel") || message.includes("exceeds")) {
      throw new ImageProcessError("La imagen supera el tamaño máximo que se puede procesar.")
    }

    throw new ImageProcessError(
      "No se pudo procesar la imagen. Exportala como JPEG o PNG e intentá de nuevo.",
    )
  }
}
