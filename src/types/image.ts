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
