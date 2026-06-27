export type ImageExif = {
  shootDate?: string
  camera?: string
  lens?: string
  iso?: number
  aperture?: string
  shutterSpeed?: string
  focalLength?: string
  location?: { lat: number; lng: number }
}

export type ImageRecord = {
  id: string
  filename: string
  path: string
  size: number
  width?: number
  height?: number
  mimeType: string
  hash: string
  uploaderLogin: string
  createdAt: string
  deletedAt?: string
  albumId?: string
  isPublic?: boolean
  exif?: ImageExif
  repo?: string // storage repo name, e.g. "mpic-images". undefined = default repo
}

export type ImagesIndex = {
  version: 1
  images: ImageRecord[]
}

export type ImageLinks = {
  raw: string
  cdn: string
  customCdn: string
  markdown: string
}
