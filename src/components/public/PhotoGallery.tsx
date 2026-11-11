import { PhotoViewer } from "@/components/public/PhotoViewer"
import type { GalleryPhoto } from "@/types/content"

export function PhotoGallery({ photos }: { photos: GalleryPhoto[] }) {
  if (photos.length === 0) {
    return <p className="text-sm text-mute">Esta categoría todavía no tiene fotografías publicadas.</p>
  }

  return <PhotoViewer photos={photos} variant="masonry" />
}
