import fs from 'node:fs'
import { getJsonFile } from '@/lib/github/client'
import { migrateLegacyImagesToShards } from '@/lib/services/image-store'
import type { ImagesIndex } from '@/types/image'

const ENV_FILE = '.env.vercel'

loadEnvFromFile()

type ImagesManifest = {
  shards: {
    id: string
    path: string
    imageCount: number
  }[]
}

type ImageShardFile = {
  images: {
    id: string
  }[]
}

async function main() {
  const legacy = await getJsonFile<ImagesIndex>('data/images.json')
  const legacyCount = legacy?.data.images.length || 0

  console.log(`[images:migrate] legacyCount=${legacyCount}`)

  const result = await migrateLegacyImagesToShards()
  const manifest = await getJsonFile<ImagesManifest>('data/images-manifest.json')
  if (!manifest) {
    throw new Error('Image manifest missing after migration')
  }

  const shardFiles = await Promise.all(
    manifest.data.shards.map(async shard => ({
      shard,
      file: await getJsonFile<ImageShardFile>(shard.path),
    })),
  )

  const shardedImages = shardFiles.flatMap(({ file }) => file?.data.images || [])
  const shardedCount = shardedImages.length
  const uniqueIds = new Set(shardedImages.map(image => image.id)).size
  const manifestCount = manifest.data.shards.reduce((sum, shard) => sum + shard.imageCount, 0)

  console.log(
    `[images:migrate] migrated=${result.migrated} imageCount=${result.imageCount} shardCount=${result.shardCount} manifestCount=${manifestCount} shardedCount=${shardedCount} uniqueIds=${uniqueIds}`,
  )

  if (result.migrated && legacyCount !== shardedCount) {
    throw new Error(`Image count mismatch after migration: legacy=${legacyCount} sharded=${shardedCount}`)
  }

  if (manifestCount !== shardedCount) {
    throw new Error(`Manifest count mismatch after migration: manifest=${manifestCount} sharded=${shardedCount}`)
  }

  if (uniqueIds !== shardedCount) {
    throw new Error(`Duplicate image ids detected after migration: unique=${uniqueIds} total=${shardedCount}`)
  }
}

function loadEnvFromFile() {
  if (process.env.IMAGE_GITHUB_OWNER && process.env.IMAGE_GITHUB_REPO && process.env.IMAGE_GITHUB_TOKEN) {
    return
  }

  if (!fs.existsSync(ENV_FILE)) {
    return
  }

  const content = fs.readFileSync(ENV_FILE, 'utf8')
  for (const line of content.split('\n')) {
    if (!line || line.trim().startsWith('#')) continue
    const index = line.indexOf('=')
    if (index <= 0) continue

    const key = line.slice(0, index).trim()
    const value = line.slice(index + 1).trim().replace(/^"|"$/g, '')
    if (key && !process.env[key]) {
      process.env[key] = value
    }
  }
}

main().catch(error => {
  console.error('[images:migrate] failed', error)
  process.exitCode = 1
})
