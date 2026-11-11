export const imageConfig = {
  format: "webp" as const,
  quality: 82,
  effort: 4,
  maxWidth: 2000,
  maxHeight: 2000,
  maxUploadBytes: 20 * 1024 * 1024,
  maxStoredBytes: 5 * 1024 * 1024,
  maxInputPixels: 40_000_000,
  allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/tiff"] as const,
}

export type AllowedMimeType = (typeof imageConfig.allowedMimeTypes)[number]
