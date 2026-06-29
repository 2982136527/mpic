import { createHash } from 'node:crypto'
import { getJsonFile, getPublicJsonFile, updateJsonWithRetry } from '@/lib/github/client'
import type { ImageRecord, ImagesIndex } from '@/types/image'

const LEGACY_IMAGES_PATH = 'data/images.json'
const IMAGES_MANIFEST_PATH = 'data/images-manifest.json'
const IMAGE_SHARDS_DIR = 'data/images-shards'
const IMAGE_SHARD_BUCKET_COUNT = 32
const IMAGE_STORE_CACHE_TTL_MS = 15_000
const IMAGE_SHARD_READ_CONCURRENCY = 8

type ImageShardDescriptor = {
  id: string
  path: string
  imageCount: number
  updatedAt?: string
}

type ImagesManifest = {
  version: 1
  strategy: 'id_hash_mod_32'
  shardCount: number
  shards: ImageShardDescriptor[]
  migratedAt?: string
  legacyPath?: string
}

type ImageShardFile = {
  version: 1
  shardId: string
  images: ImageRecord[]
}

type CachedImages = {
  expiresAt: number
  images: ImageRecord[]
  promise?: Promise<ImageRecord[]>
}

declare global {
  var __mpicImagesCache: CachedImages | undefined
}

export async function listAllImageRecords(): Promise<ImageRecord[]> {
  return getCachedImages()
}

export async function getImageRecordById(id: string): Promise<ImageRecord | null> {
  const manifest = await readManifestPublic()
  if (!manifest) {
    const legacy = await getPublicJsonFile<ImagesIndex>(LEGACY_IMAGES_PATH)
    return legacy?.images.find(image => image.id === id) || null
  }

  const shard = await readShardPublic(getShardDescriptor(manifest, getShardIdForImageId(id)))
  return shard.images.find(image => image.id === id) || null
}

export async function upsertImageRecord(record: ImageRecord): Promise<void> {
  const manifest = await readManifestMutable()
  if (!manifest) {
    await upsertLegacyImageRecord(record)
    invalidateImageStoreCache()
    return
  }

  const shardId = getShardIdForImageId(record.id)
  const descriptor = getShardDescriptor(manifest, shardId)
  let nextCount = 0

  await updateJsonWithRetry<ImageShardFile>(descriptor.path, current => {
    const shard = normalizeShard(shardId, current)
    const existingIndex = shard.images.findIndex(image => image.id === record.id)
    if (existingIndex >= 0) {
      shard.images[existingIndex] = record
    } else {
      shard.images.unshift(record)
    }
    nextCount = shard.images.length
    return shard
  })

  await updateManifestShardMeta(shardId, nextCount)
  invalidateImageStoreCache()
}

export async function updateImageRecord(
  id: string,
  updater: (current: ImageRecord) => ImageRecord | null,
): Promise<{ previous: ImageRecord | null; next: ImageRecord | null }> {
  const manifest = await readManifestMutable()
  if (!manifest) {
    const result = await updateLegacyImageRecord(id, updater)
    invalidateImageStoreCache()
    return result
  }

  const shardId = getShardIdForImageId(id)
  const descriptor = getShardDescriptor(manifest, shardId)
  let previous: ImageRecord | null = null
  let next: ImageRecord | null = null
  let nextCount = 0

  await updateJsonWithRetry<ImageShardFile>(descriptor.path, current => {
    const shard = normalizeShard(shardId, current)
    const index = shard.images.findIndex(image => image.id === id)

    if (index < 0) {
      nextCount = shard.images.length
      return shard
    }

    previous = shard.images[index]
    const updated = updater(previous)
    if (updated) {
      shard.images[index] = updated
      next = updated
    } else {
      shard.images.splice(index, 1)
      next = null
    }

    nextCount = shard.images.length
    return shard
  })

  await updateManifestShardMeta(shardId, nextCount)
  invalidateImageStoreCache()
  return { previous, next }
}

export async function migrateLegacyImagesToShards(): Promise<{
  migrated: boolean
  imageCount: number
  shardCount: number
}> {
  const existingManifest = await readManifestMutable()
  if (existingManifest) {
    return {
      migrated: false,
      imageCount: existingManifest.shards.reduce((sum, shard) => sum + shard.imageCount, 0),
      shardCount: existingManifest.shards.length,
    }
  }

  const legacy = await getJsonFile<ImagesIndex>(LEGACY_IMAGES_PATH)
  const images = legacy?.data.images || []
  const manifest = buildManifest(images)
  const shards = buildShardMap(images)
  const writtenAt = new Date().toISOString()

  for (const descriptor of manifest.shards) {
    const shardImages = shards.get(descriptor.id) || []
    if (shardImages.length === 0) continue

    await updateJsonWithRetry<ImageShardFile>(descriptor.path, () => ({
      version: 1,
      shardId: descriptor.id,
      images: shardImages,
    }))
  }

  await updateJsonWithRetry<ImagesManifest>(IMAGES_MANIFEST_PATH, () => ({
    ...manifest,
    migratedAt: writtenAt,
  }))

  invalidateImageStoreCache()

  return {
    migrated: true,
    imageCount: images.length,
    shardCount: manifest.shards.length,
  }
}

export function invalidateImageStoreCache() {
  globalThis.__mpicImagesCache = undefined
}

async function readManifestPublic(): Promise<ImagesManifest | null> {
  const data = await getPublicJsonFile<ImagesManifest>(IMAGES_MANIFEST_PATH)
  if (!data) return null
  return normalizeManifest(data)
}

async function readManifestMutable(): Promise<ImagesManifest | null> {
  const file = await getJsonFile<ImagesManifest>(IMAGES_MANIFEST_PATH)
  if (!file) return null
  return normalizeManifest(file.data)
}

async function readShardPublic(descriptor: ImageShardDescriptor): Promise<ImageShardFile> {
  const data = await getPublicJsonFile<ImageShardFile>(descriptor.path)
  return normalizeShard(descriptor.id, data)
}

async function getCachedImages(): Promise<ImageRecord[]> {
  const cache = globalThis.__mpicImagesCache
  const now = Date.now()

  if (cache && cache.expiresAt > now) {
    return cache.images
  }

  if (cache?.promise) {
    return cache.promise
  }

  const promise = readAllImagesUncached()
  globalThis.__mpicImagesCache = {
    expiresAt: cache?.expiresAt || 0,
    images: cache?.images || [],
    promise,
  }

  try {
    const images = await promise
    globalThis.__mpicImagesCache = {
      expiresAt: Date.now() + IMAGE_STORE_CACHE_TTL_MS,
      images,
    }
    return images
  } finally {
    const latest = globalThis.__mpicImagesCache
    if (latest?.promise === promise) {
      globalThis.__mpicImagesCache = {
        expiresAt: latest.expiresAt,
        images: latest.images,
      }
    }
  }
}

async function readAllImagesUncached(): Promise<ImageRecord[]> {
  const manifest = await readManifestPublic()
  if (!manifest) {
    const legacy = await getPublicJsonFile<ImagesIndex>(LEGACY_IMAGES_PATH)
    return sortImages(legacy?.images || [])
  }

  const shardImages = await mapWithConcurrency(
    manifest.shards.filter(descriptor => descriptor.imageCount > 0),
    IMAGE_SHARD_READ_CONCURRENCY,
    async descriptor => (await readShardPublic(descriptor)).images,
  )

  return sortImages(shardImages.flat())
}

async function updateManifestShardMeta(shardId: string, imageCount: number): Promise<void> {
  await updateJsonWithRetry<ImagesManifest>(IMAGES_MANIFEST_PATH, current => {
    const manifest = normalizeManifest(current)
    const shard = getShardDescriptor(manifest, shardId)
    shard.imageCount = imageCount
    shard.updatedAt = new Date().toISOString()
    return manifest
  })
}

function buildManifest(images: ImageRecord[]): ImagesManifest {
  const shards = defaultShardDescriptors()
  const counts = new Map<string, number>()

  for (const image of images) {
    const shardId = getShardIdForImageId(image.id)
    counts.set(shardId, (counts.get(shardId) || 0) + 1)
  }

  return {
    version: 1,
    strategy: 'id_hash_mod_32',
    shardCount: IMAGE_SHARD_BUCKET_COUNT,
    legacyPath: LEGACY_IMAGES_PATH,
    migratedAt: new Date().toISOString(),
    shards: shards.map(shard => ({
      ...shard,
      imageCount: counts.get(shard.id) || 0,
    })),
  }
}

function buildShardMap(images: ImageRecord[]): Map<string, ImageRecord[]> {
  const shards = new Map<string, ImageRecord[]>()

  for (const image of images) {
    const shardId = getShardIdForImageId(image.id)
    const bucket = shards.get(shardId) || []
    bucket.push(image)
    shards.set(shardId, bucket)
  }

  return shards
}

async function upsertLegacyImageRecord(record: ImageRecord): Promise<void> {
  await updateJsonWithRetry<ImagesIndex>(LEGACY_IMAGES_PATH, current => {
    const index = normalizeLegacyIndex(current)
    const existingIndex = index.images.findIndex(image => image.id === record.id)
    if (existingIndex >= 0) {
      index.images[existingIndex] = record
    } else {
      index.images.unshift(record)
    }
    return index
  })
}

async function updateLegacyImageRecord(
  id: string,
  updater: (current: ImageRecord) => ImageRecord | null,
): Promise<{ previous: ImageRecord | null; next: ImageRecord | null }> {
  let previous: ImageRecord | null = null
  let next: ImageRecord | null = null

  await updateJsonWithRetry<ImagesIndex>(LEGACY_IMAGES_PATH, current => {
    const index = normalizeLegacyIndex(current)
    const imageIndex = index.images.findIndex(image => image.id === id)
    if (imageIndex < 0) {
      return index
    }

    previous = index.images[imageIndex]
    const updated = updater(previous)
    if (updated) {
      index.images[imageIndex] = updated
      next = updated
    } else {
      index.images.splice(imageIndex, 1)
      next = null
    }

    return index
  })

  return { previous, next }
}

function normalizeLegacyIndex(current: ImagesIndex | null | undefined): ImagesIndex {
  return {
    version: 1,
    images: current?.images || [],
  }
}

function normalizeManifest(current: ImagesManifest | null | undefined): ImagesManifest {
  const defaults = defaultShardDescriptors()
  const existing = new Map((current?.shards || []).map(shard => [shard.id, shard]))

  return {
    version: 1,
    strategy: 'id_hash_mod_32',
    shardCount: IMAGE_SHARD_BUCKET_COUNT,
    legacyPath: LEGACY_IMAGES_PATH,
    migratedAt: current?.migratedAt,
    shards: defaults.map(shard => ({
      ...shard,
      ...existing.get(shard.id),
    })),
  }
}

function normalizeShard(shardId: string, current: ImageShardFile | null | undefined): ImageShardFile {
  return {
    version: 1,
    shardId,
    images: current?.images || [],
  }
}

function defaultShardDescriptors(): ImageShardDescriptor[] {
  return Array.from({ length: IMAGE_SHARD_BUCKET_COUNT }, (_, index) => {
    const id = index.toString(16).padStart(2, '0')
    return {
      id,
      path: `${IMAGE_SHARDS_DIR}/${id}.json`,
      imageCount: 0,
    }
  })
}

function getShardDescriptor(manifest: ImagesManifest, shardId: string): ImageShardDescriptor {
  const shard = manifest.shards.find(item => item.id === shardId)
  if (!shard) {
    throw new Error(`Unknown image shard: ${shardId}`)
  }
  return shard
}

function getShardIdForImageId(id: string): string {
  const byte = createHash('sha1').update(id).digest()[0] ?? 0
  return (byte % IMAGE_SHARD_BUCKET_COUNT).toString(16).padStart(2, '0')
}

function sortImages(images: ImageRecord[]): ImageRecord[] {
  return [...images].sort((a, b) => {
    const byCreatedAt = b.createdAt.localeCompare(a.createdAt)
    if (byCreatedAt !== 0) return byCreatedAt
    return b.id.localeCompare(a.id)
  })
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length)
  let index = 0

  async function consume() {
    while (index < items.length) {
      const currentIndex = index
      index += 1
      results[currentIndex] = await worker(items[currentIndex])
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => consume())
  await Promise.all(workers)
  return results
}
