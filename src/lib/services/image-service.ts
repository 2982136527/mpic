import { getJsonFile, updateJsonWithRetry, uploadBinary, getFile, deleteFile } from '@/lib/github/client'
import { updateUserStats } from '@/lib/services/user-service'
import { getActiveRepo, updateRepoSize } from '@/lib/services/repo-service'
import { getSettings } from '@/lib/services/settings-service'
import { getDefaultRepoName } from '@/lib/github/env'
import { generateId } from '@/lib/utils'
import type { ImageRecord, ImagesIndex, ImageLinks, ImageExif } from '@/types/image'

const IMAGES_PATH = 'data/images.json'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

async function compressImage(buffer: Buffer, mimeType: string): Promise<{ buffer: Buffer; mimeType: string }> {
  // If already under limit, return as-is
  if (buffer.length <= MAX_FILE_SIZE) return { buffer, mimeType }

  const isAnimated = mimeType === 'image/gif'

  // For animated GIF, just return (hard to compress without losing animation)
  if (isAnimated) return { buffer, mimeType }

  const sharp = (await import('sharp')).default

  // Convert PNG to JPEG for better compression (unless it has transparency)
  if (mimeType === 'image/png') {
    const metadata = await sharp(buffer).metadata()
    const hasAlpha = metadata.channels === 4

    if (!hasAlpha) {
      // Convert to JPEG with progressive quality reduction
      for (const quality of [85, 75, 65, 55, 45]) {
        const compressed = await sharp(buffer).jpeg({ quality, mozjpeg: true }).toBuffer()
        if (compressed.length <= MAX_FILE_SIZE) {
          return { buffer: compressed, mimeType: 'image/jpeg' }
        }
      }
    }
  }

  // For JPEG and WebP, reduce quality progressively
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

  // Last resort: resize to max 2048px on longest side
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
  const owner = process.env.IMAGE_GITHUB_OWNER
  const repo = record.repo || getDefaultRepoName()
  const branch = process.env.IMAGE_GITHUB_BRANCH || 'main'
  const cdnBaseUrl = process.env.NEXT_PUBLIC_CDN_BASE_URL || ''

  const raw = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${record.path}`
  const cdn = `https://cdn.jsdelivr.net/gh/${owner}/${repo}@${branch}/${record.path}`
  const customCdn = cdnBaseUrl ? `${cdnBaseUrl.replace(/\/$/, '')}/${record.path}` : ''
  const markdown = `![${record.filename}](${cdn})`

  return { raw, cdn, customCdn, markdown }
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
}): Promise<{ images: ImageRecord[]; total: number; hasMore: boolean }> {
  const { page = 1, pageSize = 30, search, uploaderLogin, publicOnly, albumId, yearMonth, camera, lens } = params
  const file = await getJsonFile<ImagesIndex>(IMAGES_PATH)
  if (!file) return { images: [], total: 0, hasMore: false }

  let images = file.data.images.filter(img => !img.deletedAt)

  if (publicOnly) {
    images = images.filter(img => img.isPublic !== false)
  }

  if (search) {
    const q = search.toLowerCase()
    images = images.filter(img => img.filename.toLowerCase().includes(q))
  }

  if (uploaderLogin) {
    images = images.filter(img => img.uploaderLogin === uploaderLogin)
  }

  if (albumId !== undefined) {
    if (albumId === '') {
      images = images.filter(img => !img.albumId)
    } else {
      images = images.filter(img => img.albumId === albumId)
    }
  }

  if (yearMonth) {
    images = images.filter(img => {
      const date = img.exif?.shootDate || img.createdAt
      return date.startsWith(yearMonth)
    })
  }

  if (camera) {
    images = images.filter(img => img.exif?.camera === camera)
  }

  if (lens) {
    images = images.filter(img => img.exif?.lens === lens)
  }

  images.sort((a, b) => {
    const dateA = a.exif?.shootDate || a.createdAt
    const dateB = b.exif?.shootDate || b.createdAt
    return dateB.localeCompare(dateA)
  })

  const total = images.length
  const start = (page - 1) * pageSize
  const sliced = images.slice(start, start + pageSize)

  return { images: sliced, total, hasMore: start + pageSize < total }
}

export async function getImage(id: string): Promise<ImageRecord | null> {
  const file = await getJsonFile<ImagesIndex>(IMAGES_PATH)
  if (!file) return null
  return file.data.images.find(img => img.id === id && !img.deletedAt) || null
}

export async function getRandomPublicImage(): Promise<{ record: ImageRecord; links: ImageLinks } | null> {
  const file = await getJsonFile<ImagesIndex>(IMAGES_PATH)
  if (!file) return null
  const publicImages = file.data.images.filter(img => !img.deletedAt && img.isPublic !== false)
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

  // Compress if over limit and compression is enabled
  let compressed = false
  if (settings.enableCompress && buffer.length > MAX_FILE_SIZE) {
    const result = await compressImage(buffer, mimeType)
    buffer = result.buffer
    mimeType = result.mimeType
    compressed = true

    if (buffer.length > settings.maxFileSizeBytes) {
      throw new Error(`图片压缩后仍超过 ${Math.round(settings.maxFileSizeBytes / 1024 / 1024)}MB，无法上传`)
    }
  }

  const hashBuffer = await crypto.subtle.digest('SHA-256', new Uint8Array(buffer))
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

  const existingFile = await getJsonFile<ImagesIndex>(IMAGES_PATH)
  if (existingFile) {
    const duplicate = existingFile.data.images.find(img => img.hash === hash && !img.deletedAt)
    if (duplicate) {
      return { record: duplicate, isDuplicate: true }
    }
  }

  // Get the active repo for this upload
  const repoName = await getActiveRepo()

  // Update extension if compression changed the format
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
  if (typeof Image !== 'undefined') {
    try {
      const blob = new Blob([new Uint8Array(buffer)], { type: mimeType })
      const url = URL.createObjectURL(blob)
      const img = new Image()
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = () => reject(new Error('Failed to load image'))
        img.src = url
      })
      width = img.width
      height = img.height
      URL.revokeObjectURL(url)
    } catch {
      // Skip dimensions if not available
    }
  }

  // Extract EXIF data
  let exif: ImageExif | undefined
  try {
    const exifr = await import('exifr')
    const metadata = await exifr.parse(new Uint8Array(buffer), {
      pick: ['DateTimeOriginal', 'CreateDate', 'Make', 'Model', 'LensModel', 'LensMake',
             'ISO', 'FNumber', 'ExposureTime', 'FocalLength', 'GPSLatitude', 'GPSLongitude'],
    })
    if (metadata) {
      const exifData: ImageExif = {}

      // Shoot date
      const shootDate = metadata.DateTimeOriginal || metadata.CreateDate
      if (shootDate instanceof Date) {
        exifData.shootDate = shootDate.toISOString()
      } else if (typeof shootDate === 'string') {
        exifData.shootDate = shootDate
      }

      // Camera
      if (metadata.Make || metadata.Model) {
        exifData.camera = [metadata.Make, metadata.Model].filter(Boolean).join(' ').trim()
      }

      // Lens
      if (metadata.LensModel) {
        exifData.lens = metadata.LensModel
      } else if (metadata.LensMake) {
        exifData.lens = metadata.LensMake
      }

      // Settings
      if (metadata.ISO) exifData.iso = Number(metadata.ISO)
      if (metadata.FNumber) exifData.aperture = `f/${metadata.FNumber}`
      if (metadata.ExposureTime) {
        const t = Number(metadata.ExposureTime)
        exifData.shutterSpeed = t < 1 ? `1/${Math.round(1 / t)}s` : `${t}s`
      }
      if (metadata.FocalLength) exifData.focalLength = `${metadata.FocalLength}mm`

      // GPS
      if (metadata.GPSLatitude && metadata.GPSLongitude) {
        exifData.location = {
          lat: Number(metadata.GPSLatitude),
          lng: Number(metadata.GPSLongitude),
        }
      }

      if (Object.keys(exifData).length > 0) {
        exif = exifData
      }
    }
  } catch {
    // EXIF extraction failed, skip silently
  }

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
    ...(albumId && { albumId }),
    ...(isPublic !== undefined && { isPublic }),
    ...(exif && { exif }),
    ...(repoName !== defaultRepo && { repo: repoName }),
  }

  await updateJsonWithRetry<ImagesIndex>(IMAGES_PATH, current => {
    const index = current || emptyIndex()
    index.images.unshift(record)
    return index
  })

  await updateUserStats(uploaderLogin, buffer.length, 1)
  await updateRepoSize(repoName, buffer.length)

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

    const fileOnGithub = await getFile(image.path, image.repo)
    if (fileOnGithub) {
      await deleteFile({ path: image.path, sha: fileOnGithub.sha, message: `Delete ${image.filename}`, repo: image.repo })
    }
  } else {
    await updateJsonWithRetry<ImagesIndex>(IMAGES_PATH, current => {
      const index = current || emptyIndex()
      const img = index.images.find(i => i.id === id)
      if (img) img.deletedAt = new Date().toISOString()
      return index
    })
  }

  await updateUserStats(image.uploaderLogin, -image.size, -1)
  await updateRepoSize(image.repo || getDefaultRepoName(), -image.size)
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

  let images = file.data.images.filter(img => !img.deletedAt)
  if (publicOnly) {
    images = images.filter(img => img.isPublic !== false)
  }

  const counts = new Map<string, number>()
  for (const img of images) {
    const date = img.exif?.shootDate || img.createdAt
    const ym = date.slice(0, 7) // YYYY-MM
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

  let images = file.data.images.filter(img => !img.deletedAt)
  if (publicOnly) {
    images = images.filter(img => img.isPublic !== false)
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

  const cameras = Array.from(cameraCounts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)

  const lenses = Array.from(lensCounts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)

  return { cameras, lenses }
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
    const img = index.images.find(i => i.id === id)
    if (img) img.isPublic = isPublic
    return index
  })
}

export async function updateImageAlbum(id: string, albumId: string | null): Promise<void> {
  await updateJsonWithRetry<ImagesIndex>(IMAGES_PATH, current => {
    const index = current || emptyIndex()
    const img = index.images.find(i => i.id === id)
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
