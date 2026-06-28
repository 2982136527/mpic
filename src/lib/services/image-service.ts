import { getJsonFile, updateJsonWithRetry, uploadBinary, getFile, deleteFile } from '@/lib/github/client'
import { getDefaultRepoName } from '@/lib/github/env'
import { buildPixivProxyUrl } from '@/lib/pixiv'
import { getActiveRepo, updateRepoSize } from '@/lib/services/repo-service'
import { getSettings } from '@/lib/services/settings-service'
import { updateUserStats } from '@/lib/services/user-service'
import { generateId } from '@/lib/utils'
import type { ImageExif, ImageLinks, ImageRecord, ImagesIndex } from '@/types/image'

const IMAGES_PATH = 'data/images.json'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

async function compressImage(buffer: Buffer, mimeType: string): Promise<{ buffer: Buffer; mimeType: string }> {
  if (buffer.length <= MAX_FILE_SIZE) return { buffer, mimeType }

  if (mimeType === 'image/gif') return { buffer, mimeType }

  const sharp = (await import('sharp')).default

  if (mimeType === 'image/png') {
    const metadata = await sharp(buffer).metadata()
    const hasAlpha = metadata.channels === 4

    if (!hasAlpha) {
      for (const quality of [85, 75, 65, 55, 45]) {
        const compressed = await sharp(buffer).jpeg({ quality, mozjpeg: true }).toBuffer()
        if (compressed.length <= MAX_FILE_SIZE) {
          return { buffer: compressed, mimeType: 'image/jpeg' }
        }
      }
    }
  }

  const outputFormat = mimeType === 'image/webp' ? 'webp' : 'jpeg'

  for (const quality of [85, 75, 65, 55, 45, 35]) {
    const compressed = await sharp(buffer)[outputFormat]({
      quality,
      ...(outputFormat === 'jpeg' ? { mozjpeg: true } : {}),
    }).toBuffer()

    if (compressed.length <= MAX_FILE_SIZE) {
      return { buffer: compressed, mimeType: outputFormat === 'webp' ? 'image/webp' : 'image/jpeg' }
    }
  }

  const resized = await sharp(buffer)
    .resize(2048, 2048, { fit: 'inside', withoutEnlargement: true })
    [outputFormat]({ quality: 50, ...(outputFormat === 'jpeg' ? { mozjpeg: true } : {}) })
    .toBuffer()

  return { buffer: resized, mimeType: outputFormat === 'webp' ? 'image/webp' : 'image/jpeg' }
}

function emptyIndex(): ImagesIndex {
  return { version: 1, images: [] }
}

export function buildImageLinks(record: ImageRecord): ImageLinks {
  if (record.storageKind === 'external') {
    return buildExternalImageLinks(record)
  }

  return buildLocalImageLinks(record)
}

function buildLocalImageLinks(record: ImageRecord): ImageLinks {
  const owner = process.env.IMAGE_GITHUB_OWNER
  const repo = record.repo || getDefaultRepoName()
  const branch = process.env.IMAGE_GITHUB_BRANCH || 'main'
  const cdnBaseUrl = process.env.NEXT_PUBLIC_CDN_BASE_URL || ''
  const path = record.path || ''

  const raw = path ? `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}` : ''
  const cdn = path ? `https://cdn.jsdelivr.net/gh/${owner}/${repo}@${branch}/${path}` : ''
  const customCdn = path && cdnBaseUrl ? `${cdnBaseUrl.replace(/\/$/, '')}/${path}` : ''
  const displayCandidates = uniqueUrls([customCdn, cdn, raw])
  const markdownTarget = displayCandidates[0] || cdn || raw

  return {
    raw,
    cdn,
    customCdn,
    markdown: markdownTarget ? `![${record.title || record.filename}](${markdownTarget})` : '',
    displayCandidates,
  }
}

function buildExternalImageLinks(record: ImageRecord): ImageLinks {
  const raw = record.externalUrl || ''
  const cdn = record.sourceProvider === 'pixiv' && raw ? buildPixivProxyUrl(raw) : ''
  const displayCandidates = uniqueUrls([raw, cdn])
  const markdownTarget = displayCandidates[0] || raw || cdn

  return {
    raw,
    cdn,
    customCdn: '',
    markdown: markdownTarget ? `![${record.title || record.filename}](${markdownTarget})` : '',
    displayCandidates,
  }
}

export async function listImages(params: {
  page?: number
  pageSize?: number
  search?: string
  uploaderLogin?: string
  publicOnly?: boolean
  albumId?: string
  yearMonth?: string
  camera?: string
  lens?: string
  before?: string
  beforeId?: string
}): Promise<{ images: ImageRecord[]; total: number; hasMore: boolean }> {
  const {
    page = 1,
    pageSize = 30,
    search,
    uploaderLogin,
    publicOnly,
    albumId,
    yearMonth,
    camera,
    lens,
    before,
    beforeId,
  } = params

  const file = await getJsonFile<ImagesIndex>(IMAGES_PATH)
  if (!file) return { images: [], total: 0, hasMore: false }

  const settings = publicOnly ? await getSettings() : null
  let images = file.data.images.filter(img => !img.deletedAt)

  if (publicOnly) {
    images = images.filter(img => isPubliclyVisible(img, settings))
  }

  if (search) {
    const q = search.toLowerCase()
    images = images.filter(img => matchesImageSearch(img, q))
  }

  if (uploaderLogin) {
    images = images.filter(img => img.uploaderLogin === uploaderLogin)
  }

  if (albumId !== undefined) {
    images = albumId === '' ? images.filter(img => !img.albumId) : images.filter(img => img.albumId === albumId)
  }

  if (yearMonth) {
    images = images.filter(img => (img.exif?.shootDate || img.createdAt).startsWith(yearMonth))
  }

  if (camera) {
    images = images.filter(img => img.exif?.camera === camera)
  }

  if (lens) {
    images = images.filter(img => img.exif?.lens === lens)
  }

  if (before) {
    images = images.filter(img => {
      const sortValue = getImageSortValue(img)
      if (sortValue < before) return true
      if (sortValue > before) return false
      if (!beforeId) return false
      return img.id < beforeId
    })
  }

  images.sort((a, b) => {
    const byDate = getImageSortValue(b).localeCompare(getImageSortValue(a))
    if (byDate !== 0) return byDate
    return b.id.localeCompare(a.id)
  })

  const total = images.length
  const start = before ? 0 : (page - 1) * pageSize
  const sliced = images.slice(start, start + pageSize)

  return { images: sliced, total, hasMore: start + pageSize < total }
}

function getImageSortValue(img: ImageRecord): string {
  return img.exif?.shootDate || img.createdAt
}

export async function getImage(id: string, options?: { publicOnly?: boolean }): Promise<ImageRecord | null> {
  const file = await getJsonFile<ImagesIndex>(IMAGES_PATH)
  if (!file) return null

  const image = file.data.images.find(img => img.id === id && !img.deletedAt) || null
  if (!image) return null
  if (!options?.publicOnly) return image

  const settings = await getSettings()
  return isPubliclyVisible(image, settings) ? image : null
}

export async function getRandomPublicImage(): Promise<{ record: ImageRecord; links: ImageLinks } | null> {
  const file = await getJsonFile<ImagesIndex>(IMAGES_PATH)
  if (!file) return null

  const settings = await getSettings()
  const publicImages = file.data.images.filter(img => !img.deletedAt && isPubliclyVisible(img, settings))
  if (publicImages.length === 0) return null

  const record = publicImages[Math.floor(Math.random() * publicImages.length)]
  return { record, links: buildImageLinks(record) }
}

export async function uploadImage(params: {
  buffer: Buffer
  filename: string
  mimeType: string
  uploaderLogin: string
  albumId?: string
  isPublic?: boolean
}): Promise<{ record: ImageRecord; isDuplicate: boolean }> {
  let { buffer, filename, mimeType, uploaderLogin, albumId, isPublic } = params
  const settings = await getSettings()

  if (settings.enableCompress && buffer.length > MAX_FILE_SIZE) {
    const result = await compressImage(buffer, mimeType)
    buffer = result.buffer
    mimeType = result.mimeType

    if (buffer.length > settings.maxFileSizeBytes) {
      throw new Error(`图片压缩后仍超过 ${Math.round(settings.maxFileSizeBytes / 1024 / 1024)}MB，无法上传`)
    }
  }

  const hash = await hashBuffer(buffer)
  const duplicate = await findDuplicateByHash(hash)
  if (duplicate) {
    return { record: duplicate, isDuplicate: true }
  }

  const repoName = await getActiveRepo()
  const extMap: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' }
  const ext = extMap[mimeType] || filename.split('.').pop() || 'png'
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const id = generateId()
  const path = `uploads/${year}/${month}/${id}.${ext}`

  await uploadBinary(path, buffer, `Upload ${filename}`, repoName)

  let width: number | undefined
  let height: number | undefined
  try {
    const sharp = (await import('sharp')).default
    const metadata = await sharp(buffer, { animated: true }).metadata()
    width = metadata.width
    height = metadata.height
  } catch {
    // ignore
  }

  const exif = await extractExif(buffer)
  const defaultRepo = getDefaultRepoName()
  const record: ImageRecord = {
    id,
    filename,
    path,
    size: buffer.length,
    width,
    height,
    mimeType,
    hash,
    uploaderLogin,
    createdAt: now.toISOString(),
    ...(albumId ? { albumId } : {}),
    ...(isPublic !== undefined ? { isPublic } : {}),
    ...(exif ? { exif } : {}),
    ...(repoName !== defaultRepo ? { repo: repoName } : {}),
  }

  await insertImageRecord(record)
  await updateUserStats(uploaderLogin, buffer.length, 1)
  await updateRepoSize(repoName, buffer.length)

  return { record, isDuplicate: false }
}

export async function createExternalImage(params: {
  filename: string
  mimeType: string
  uploaderLogin: string
  hash: string
  externalUrl: string
  title?: string
  width?: number
  height?: number
  albumId?: string
  isPublic?: boolean
  tags?: string[]
  sourceProvider?: string
  sourceId?: string
  sourcePageUrl?: string
  sourceCreatedAt?: string
}): Promise<{ record: ImageRecord; isDuplicate: boolean }> {
  const duplicate = await findDuplicateByHash(params.hash)
  if (duplicate) {
    return { record: duplicate, isDuplicate: true }
  }

  const now = new Date().toISOString()
  const record: ImageRecord = {
    id: generateId(),
    filename: params.filename,
    ...(params.title ? { title: params.title } : {}),
    size: 0,
    ...(params.width ? { width: params.width } : {}),
    ...(params.height ? { height: params.height } : {}),
    mimeType: params.mimeType,
    hash: params.hash,
    uploaderLogin: params.uploaderLogin,
    createdAt: now,
    storageKind: 'external',
    externalUrl: params.externalUrl,
    ...(params.albumId ? { albumId: params.albumId } : {}),
    ...(params.isPublic !== undefined ? { isPublic: params.isPublic } : {}),
    ...(params.tags && params.tags.length > 0 ? { tags: params.tags } : {}),
    ...(params.sourceProvider ? { sourceProvider: params.sourceProvider } : {}),
    ...(params.sourceId ? { sourceId: params.sourceId } : {}),
    ...(params.sourcePageUrl ? { sourcePageUrl: params.sourcePageUrl } : {}),
    ...(params.sourceCreatedAt ? { sourceCreatedAt: params.sourceCreatedAt } : {}),
  }

  await insertImageRecord(record)
  await updateUserStats(params.uploaderLogin, 0, 1)

  return { record, isDuplicate: false }
}

export async function deleteImage(id: string, login: string, isAdmin: boolean): Promise<void> {
  const file = await getJsonFile<ImagesIndex>(IMAGES_PATH)
  if (!file) throw new Error('Images index not found')

  const image = file.data.images.find(img => img.id === id)
  if (!image) throw new Error('Image not found')
  if (!isAdmin && image.uploaderLogin !== login) throw new Error('Not authorized')

  if (isAdmin) {
    await updateJsonWithRetry<ImagesIndex>(IMAGES_PATH, current => {
      const index = current || emptyIndex()
      index.images = index.images.filter(img => img.id !== id)
      return index
    })

    if (image.path) {
      const fileOnGithub = await getFile(image.path, image.repo)
      if (fileOnGithub) {
        await deleteFile({ path: image.path, sha: fileOnGithub.sha, message: `Delete ${image.filename}`, repo: image.repo })
      }
    }
  } else {
    await updateJsonWithRetry<ImagesIndex>(IMAGES_PATH, current => {
      const index = current || emptyIndex()
      const currentImage = index.images.find(item => item.id === id)
      if (currentImage) currentImage.deletedAt = new Date().toISOString()
      return index
    })
  }

  await updateUserStats(image.uploaderLogin, -image.size, -1)
  if (image.path) {
    await updateRepoSize(image.repo || getDefaultRepoName(), -image.size)
  }
}

export async function getUserStats(login: string): Promise<{ imageCount: number; totalSize: number }> {
  const file = await getJsonFile<ImagesIndex>(IMAGES_PATH)
  if (!file) return { imageCount: 0, totalSize: 0 }

  const userImages = file.data.images.filter(img => img.uploaderLogin === login && !img.deletedAt)
  return {
    imageCount: userImages.length,
    totalSize: userImages.reduce((sum, img) => sum + img.size, 0),
  }
}

export async function getTimeline(publicOnly = false): Promise<{ yearMonth: string; count: number }[]> {
  const file = await getJsonFile<ImagesIndex>(IMAGES_PATH)
  if (!file) return []

  const settings = publicOnly ? await getSettings() : null
  let images = file.data.images.filter(img => !img.deletedAt)
  if (publicOnly) {
    images = images.filter(img => isPubliclyVisible(img, settings))
  }

  const counts = new Map<string, number>()
  for (const img of images) {
    const ym = (img.exif?.shootDate || img.createdAt).slice(0, 7)
    counts.set(ym, (counts.get(ym) || 0) + 1)
  }

  return Array.from(counts.entries())
    .map(([yearMonth, count]) => ({ yearMonth, count }))
    .sort((a, b) => b.yearMonth.localeCompare(a.yearMonth))
}

export async function getExifFilters(publicOnly = false): Promise<{
  cameras: { name: string; count: number }[]
  lenses: { name: string; count: number }[]
}> {
  const file = await getJsonFile<ImagesIndex>(IMAGES_PATH)
  if (!file) return { cameras: [], lenses: [] }

  const settings = publicOnly ? await getSettings() : null
  let images = file.data.images.filter(img => !img.deletedAt)
  if (publicOnly) {
    images = images.filter(img => isPubliclyVisible(img, settings))
  }

  const cameraCounts = new Map<string, number>()
  const lensCounts = new Map<string, number>()

  for (const img of images) {
    if (img.exif?.camera) {
      cameraCounts.set(img.exif.camera, (cameraCounts.get(img.exif.camera) || 0) + 1)
    }
    if (img.exif?.lens) {
      lensCounts.set(img.exif.lens, (lensCounts.get(img.exif.lens) || 0) + 1)
    }
  }

  return {
    cameras: Array.from(cameraCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count),
    lenses: Array.from(lensCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count),
  }
}

export async function getAdminStats(): Promise<{
  totalImages: number
  totalSize: number
  totalUsers: number
  todayUploads: number
}> {
  const file = await getJsonFile<ImagesIndex>(IMAGES_PATH)
  const images = file?.data.images.filter(img => !img.deletedAt) || []

  const today = new Date().toISOString().slice(0, 10)
  const todayUploads = images.filter(img => img.createdAt.startsWith(today)).length

  const { listUsers } = await import('@/lib/services/user-service')
  const users = await listUsers()

  return {
    totalImages: images.length,
    totalSize: images.reduce((sum, img) => sum + img.size, 0),
    totalUsers: users.length,
    todayUploads,
  }
}

export async function updateImagePrivacy(id: string, isPublic: boolean): Promise<void> {
  await updateJsonWithRetry<ImagesIndex>(IMAGES_PATH, current => {
    const index = current || emptyIndex()
    const img = index.images.find(item => item.id === id)
    if (img) img.isPublic = isPublic
    return index
  })
}

export async function updateImageAlbum(id: string, albumId: string | null): Promise<void> {
  await updateJsonWithRetry<ImagesIndex>(IMAGES_PATH, current => {
    const index = current || emptyIndex()
    const img = index.images.find(item => item.id === id)
    if (img) {
      if (albumId) {
        img.albumId = albumId
      } else {
        delete img.albumId
      }
    }
    return index
  })
}

async function hashBuffer(buffer: Buffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', new Uint8Array(buffer))
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('')
}

async function findDuplicateByHash(hash: string): Promise<ImageRecord | null> {
  const file = await getJsonFile<ImagesIndex>(IMAGES_PATH)
  if (!file) return null
  return file.data.images.find(img => img.hash === hash && !img.deletedAt) || null
}

async function insertImageRecord(record: ImageRecord): Promise<void> {
  await updateJsonWithRetry<ImagesIndex>(IMAGES_PATH, current => {
    const index = current || emptyIndex()
    index.images.unshift(record)
    return index
  })
}

async function extractExif(buffer: Buffer): Promise<ImageExif | undefined> {
  try {
    const exifr = await import('exifr')
    const metadata = await exifr.parse(new Uint8Array(buffer), {
      pick: ['DateTimeOriginal', 'CreateDate', 'Make', 'Model', 'LensModel', 'LensMake', 'ISO', 'FNumber', 'ExposureTime', 'FocalLength', 'GPSLatitude', 'GPSLongitude'],
    })
    if (!metadata) return undefined

    const exif: ImageExif = {}
    const shootDate = metadata.DateTimeOriginal || metadata.CreateDate
    if (shootDate instanceof Date) {
      exif.shootDate = shootDate.toISOString()
    } else if (typeof shootDate === 'string') {
      exif.shootDate = shootDate
    }

    if (metadata.Make || metadata.Model) {
      exif.camera = [metadata.Make, metadata.Model].filter(Boolean).join(' ').trim()
    }
    if (metadata.LensModel) {
      exif.lens = metadata.LensModel
    } else if (metadata.LensMake) {
      exif.lens = metadata.LensMake
    }
    if (metadata.ISO) exif.iso = Number(metadata.ISO)
    if (metadata.FNumber) exif.aperture = `f/${metadata.FNumber}`
    if (metadata.ExposureTime) {
      const time = Number(metadata.ExposureTime)
      exif.shutterSpeed = time < 1 ? `1/${Math.round(1 / time)}s` : `${time}s`
    }
    if (metadata.FocalLength) exif.focalLength = `${metadata.FocalLength}mm`
    if (metadata.GPSLatitude && metadata.GPSLongitude) {
      exif.location = {
        lat: Number(metadata.GPSLatitude),
        lng: Number(metadata.GPSLongitude),
      }
    }

    return Object.keys(exif).length > 0 ? exif : undefined
  } catch {
    return undefined
  }
}

function matchesImageSearch(image: ImageRecord, search: string): boolean {
  const candidates = [
    image.filename,
    image.title,
    image.sourceProvider,
    ...(image.tags || []),
  ]

  return candidates.some(value => (value ? value.toLowerCase().includes(search) : false))
}

function isPubliclyVisible(image: ImageRecord, settings: Awaited<ReturnType<typeof getSettings>> | null): boolean {
  if (image.isPublic === false) return false
  if (image.sourceProvider === 'pixiv' && settings && !settings.showPixivImages) return false
  return true
}

function uniqueUrls(values: Array<string | undefined>): string[] {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value))))
}
