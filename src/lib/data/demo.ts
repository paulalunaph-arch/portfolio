import {
  emptySettings,
  type GalleryPhoto,
  type PublishedSeries,
  type SeriesSummary,
  type SiteSettings,
} from "@/types/content"

const caption = "Imagen de prueba. No forma parte del archivo."

function photo(
  id: string,
  file: string,
  width: number,
  height: number,
): GalleryPhoto {
  return {
    id,
    src: `/demo/${file}`,
    width,
    height,
    alt: "Imagen de prueba",
    caption,
    location: "Maqueta",
    takenAt: null,
  }
}

const photos = {
  "01": photo("demo-photo-01", "demo-01.webp", 1280, 720),
  "02": photo("demo-photo-02", "demo-02.webp", 864, 1152),
  "03": photo("demo-photo-03", "demo-03.webp", 1152, 864),
  "04": photo("demo-photo-04", "demo-04.webp", 720, 1280),
  "05": photo("demo-photo-05", "demo-05.webp", 1024, 1024),
  "06": photo("demo-photo-06", "demo-06.webp", 1280, 720),
  "07": photo("demo-photo-07", "demo-07.webp", 864, 1152),
  "08": photo("demo-photo-08", "demo-08.webp", 1152, 864),
  "09": photo("demo-photo-09", "demo-09.webp", 720, 1280),
  "10": photo("demo-photo-10", "demo-10.webp", 1152, 864),
} as const

const note =
  "Serie de prueba para revisar la maqueta. Estas fotografías no forman parte del archivo de Paula Luna."

function series(
  id: string,
  title: string,
  slug: string,
  cover: GalleryPhoto,
  items: GalleryPhoto[],
): PublishedSeries {
  return {
    id,
    title,
    slug,
    description: note,
    year: null,
    location: "Maqueta",
    coverUrl: cover.src,
    coverWidth: cover.width,
    coverHeight: cover.height,
    coverAlt: cover.alt,
    photos: items,
  }
}

export const demoSettings: SiteSettings = {
  ...emptySettings,
  photographerName: "Paula Luna",
  seoTitle: "Paula Luna",
  seoDescription: "Fotoperiodismo y fotografía documental.",
  featuredImageUrl: photos["01"].src,
  featuredImageAlt: "Imagen de prueba para la portada. No forma parte del archivo.",
  featuredWidth: photos["01"].width,
  featuredHeight: photos["01"].height,
  featuredBytes: 88676,
}

export const demoSeries: PublishedSeries[] = [
  series("demo-series-calle", "Serie de prueba · Calle", "serie-de-prueba-calle", photos["01"], [
    photos["01"],
    photos["06"],
    photos["10"],
    photos["03"],
  ]),
  series(
    "demo-series-interior",
    "Serie de prueba · Interior",
    "serie-de-prueba-interior",
    photos["05"],
    [photos["04"], photos["05"], photos["08"], photos["09"]],
  ),
  series(
    "demo-series-distancia",
    "Serie de prueba · Distancia",
    "serie-de-prueba-distancia",
    photos["02"],
    [photos["02"], photos["07"]],
  ),
]

export const demoSummaries: SeriesSummary[] = demoSeries.map((item) => ({
  id: item.id,
  title: item.title,
  slug: item.slug,
  description: item.description,
  year: item.year,
  location: item.location,
  coverUrl: item.coverUrl,
  coverWidth: item.coverWidth,
  coverHeight: item.coverHeight,
  coverAlt: item.coverAlt,
}))

export function findDemoSeries(slug: string) {
  return demoSeries.find((item) => item.slug === slug) ?? null
}

const homeOrder = ["01", "02", "04", "03", "05", "07", "06", "09", "08", "10"] as const

export const demoHomeSelection: GalleryPhoto[] = homeOrder.flatMap((key) => {
  const source = photos[key]
  const series = demoSeries.find((item) => item.photos.some((photo) => photo.id === source.id))

  if (!series) {
    return []
  }

  return [
    {
      ...source,
      seriesSlug: series.slug,
      seriesTitle: series.title,
    },
  ]
})
