import fs from 'node:fs'
import sharp from 'sharp'
import { upsertImageRecord, listAllImageRecords } from '@/lib/services/image-store'

const CONCURRENCY = 8
const ENV_FILE = '.env.vercel'

loadEnvFromFile()

async function main() {
  const images = (await listAllImageRecords())
    .filter(image => !image.deletedAt && image.path && (!image.width || !image.height))

  console.log(`[images:backfill] missing dimensions=${images.length}`)
  if (images.length === 0) return

  let fixed = 0
  let failed = 0

  await mapWithConcurrency(images, async image => {
    try {
      const { width, height } = await fetchDimensions(image)
      await upsertImageRecord({
        ...image,
        width,
        height,
      })
      fixed += 1
      if (fixed % 25 === 0) {
        console.log(`[images:backfill] fixed ${fixed}/${images.length}`)
      }
    } catch (error) {
      failed += 1
      console.error(`[images:backfill] failed ${image.path}: ${error instanceof Error ? error.message : String(error)}`)
    }
  })

  console.log(`[images:backfill] done fixed=${fixed} failed=${failed}`)
}

async function fetchDimensions(image: { repo?: string; path?: string }) {
  const response = await fetch(rawUrlFor(image), {
    headers: { 'User-Agent': 'MPic-Dimension-Backfill/1.0' },
  })

  if (!response.ok) {
    throw new Error(`image fetch ${response.status}`)
  }

  const buffer = Buffer.from(await response.arrayBuffer())
  const metadata = await sharp(buffer, { animated: true }).metadata()
  if (!metadata.width || !metadata.height) {
    throw new Error('missing metadata width/height')
  }

  return { width: metadata.width, height: metadata.height }
}

function rawUrlFor(image: { repo?: string; path?: string }) {
  const owner = process.env.IMAGE_GITHUB_OWNER?.trim()
  const repo = image.repo || process.env.IMAGE_GITHUB_REPO?.trim()
  const branch = process.env.IMAGE_GITHUB_BRANCH?.trim() || 'main'
  const path = image.path

  if (!owner || !repo || !path) {
    throw new Error('Missing image GitHub environment or image path')
  }

  return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`
}

async function mapWithConcurrency<T>(items: T[], worker: (item: T) => Promise<void>) {
  let index = 0
  const workers = Array.from({ length: Math.min(CONCURRENCY, items.length) }, async () => {
    while (index < items.length) {
      const current = items[index++]
      await worker(current)
    }
  })

  await Promise.all(workers)
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
  console.error('[images:backfill] failed', error)
  process.exitCode = 1
})
