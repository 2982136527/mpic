import { getJsonFile, updateJsonWithRetry, uploadBinary, getFile, deleteFile } from '@/lib/github/client'
import { updateUserStats } from '@/lib/services/user-service'
import { getSettings } from '@/lib/services/settings-service'
import { getSiteUrl } from '@/lib/site'
import { generateId } from '@/lib/utils'
import type { ImageRecord, ImagesIndex, ImageLinks } from '@/types/image'

const IMAGES_PATH = 'data/images.json'

function emptyIndex(): ImagesIndex {
  return { version: 1, images: [] }
}

export function buildImageLinks(record: ImageRecord): ImageLinks {
  const env = process.env.IMAGE_GITHUB_OWNER
  const repo = process.env.IMAGE_GITHUB_REPO
  const branch = process.env.IMAGE_GITHUB_BRANCH || 'main'
  const cdnBaseUrl = process.env.NEXT_PUBLIC_CDN_BASE_URL || ''

  const raw = `https://raw.githubusercontent.com/${env}/${repo}/${branch}/${record.path}`
  const cdn = `https://cdn.jsdelivr.net/gh/${env}/${repo}@${branch}/${record.path}`
  const customCdn = cdnBaseUrl ? `${cdnBaseUrl.replace(/\/$/, '')}/${record.path}` : ''
  const markdown = `![${record.filename}](${cdn})`

  return { raw, cdn, customCdn, markdown }
}

export async function listImages(params: {
  page?: number
  pageSize?: number
  search?: string
  uploaderLogin?: string
}): Promise<{ images: ImageRecord[]; total: number; hasMore: boolean }> {
  const { page = 1, pageSize = 30, search, uploaderLogin } = params
  const file = await getJsonFile<ImagesIndex>(IMAGES_PATH)
  if (!file) return { images: [], total: 0, hasMore: false }

  let images = file.data.images.filter(img => !img.deletedAt)

  if (search) {
    const q = search.toLowerCase()
    images = images.filter(img => img.filename.toLowerCase().includes(q))
  }

  if (uploaderLogin) {
    images = images.filter(img => img.uploaderLogin === uploaderLogin)
  }

  images.sort((a, b) => b.createdAt.localeCompare(a.createdAt))

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

export async function uploadImage(params: {
  buffer: Buffer
  filename: string
  mimeType: string
  uploaderLogin: string
}): Promise<{ record: ImageRecord; isDuplicate: boolean }> {
  const { buffer, filename, mimeType, uploaderLogin } = params
  const settings = await getSettings()

  if (buffer.length > settings.maxFileSizeBytes) {
    throw new Error(`File size exceeds limit (${Math.round(settings.maxFileSizeBytes / 1024 / 1024)}MB)`)
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

  const ext = filename.split('.').pop() || 'png'
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const id = generateId()
  const path = `uploads/${year}/${month}/${id}.${ext}`

  await uploadBinary(path, buffer, `Upload ${filename}`)

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
  }

  await updateJsonWithRetry<ImagesIndex>(IMAGES_PATH, current => {
    const index = current || emptyIndex()
    index.images.unshift(record)
    return index
  })

  await updateUserStats(uploaderLogin, buffer.length, 1)

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

    const fileOnGithub = await getFile(image.path)
    if (fileOnGithub) {
      await deleteFile({ path: image.path, sha: fileOnGithub.sha, message: `Delete ${image.filename}` })
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
