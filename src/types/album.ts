export type AlbumRecord = {
  id: string
  name: string
  ownerLogin: string
  isPublic: boolean
  createdAt: string
}

export type AlbumsIndex = {
  version: 1
  albums: AlbumRecord[]
}
