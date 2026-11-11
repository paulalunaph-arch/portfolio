export type SocialLink = {
  label: string
  url: string
}

export type SiteSettings = {
  photographerName: string
  profession: string
  biography: string
  education: string
  interests: string
  authorStatement: string
  portraitUrl: string | null
  portraitStoragePath: string | null
  portraitAlt: string
  portraitWidth: number | null
  portraitHeight: number | null
  portraitBytes: number | null
  featuredImageUrl: string | null
  featuredImageStoragePath: string | null
  featuredImageAlt: string
  featuredWidth: number | null
  featuredHeight: number | null
  featuredBytes: number | null
  email: string
  instagram: string
  socialLinks: SocialLink[]
  seoTitle: string
  seoDescription: string
  colorBackground: string
  colorText: string
  colorMuted: string
  colorLine: string
}

export type SeriesSummary = {
  id: string
  title: string
  slug: string
  description: string | null
  year: number | null
  location: string | null
  coverUrl: string | null
  coverWidth: number | null
  coverHeight: number | null
  coverAlt: string
}

export type GalleryPhoto = {
  id: string
  src: string
  width: number
  height: number
  alt: string
  caption: string | null
  location: string | null
  takenAt: string | null
  seriesSlug?: string | null
  seriesTitle?: string | null
}

export type PublishedSeries = SeriesSummary & {
  photos: GalleryPhoto[]
}

export type AdminSeries = {
  id: string
  title: string
  slug: string
  description: string
  year: number | null
  location: string
  coverImageUrl: string | null
  coverPhotographId: string | null
  published: boolean
  sortOrder: number
  updatedAt: string
  photographCount: number
}

export type AdminPhotograph = {
  id: string
  imageUrl: string | null
  displayUrl: string | null
  storagePath: string
  storageBucket: "portfolio" | "library"
  caption: string
  altText: string
  location: string
  takenAt: string
  sortOrder: number
  homeSelected: boolean
  published: boolean
  width: number | null
  height: number | null
  fileSizeBytes: number | null
  originalFileSizeBytes: number | null
}

export type DashboardData = {
  totalSeries: number
  publishedSeries: number
  draftSeries: number
  totalPhotographs: number
  storageBytes: number | null
  recent: Array<{
    id: string
    title: string
    published: boolean
    updatedAt: string
  }>
}

export type ActionState = {
  error?: string
  ok?: string
}

export const emptySettings: SiteSettings = {
  photographerName: "Paula Luna",
  profession: "Fotoperiodismo / Fotografía documental",
  biography: "",
  education: "",
  interests: "",
  authorStatement: "",
  portraitUrl: null,
  portraitStoragePath: null,
  portraitAlt: "",
  portraitWidth: null,
  portraitHeight: null,
  portraitBytes: null,
  featuredImageUrl: null,
  featuredImageStoragePath: null,
  featuredImageAlt: "",
  featuredWidth: null,
  featuredHeight: null,
  featuredBytes: null,
  email: "",
  instagram: "",
  socialLinks: [],
  seoTitle: "Paula Luna",
  seoDescription: "Fotoperiodismo y fotografía documental.",
  colorBackground: "#040302",
  colorText: "#f5f4ef",
  colorMuted: "#a8a39b",
  colorLine: "#161412",
}
