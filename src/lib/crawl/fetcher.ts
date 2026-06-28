import { createHash } from 'node:crypto'
import type { CrawlSource } from '@/types/crawl'
import { getPixivFetchHeaders, toRegularPixivUrl } from '@/lib/pixiv'

const FETCH_TIMEOUT = 15_000

type LocalFetchResult = {
  kind: 'local'
  buffer: Buffer
  mimeType: string
  sourceUrl: string
}

type ExternalFetchResult = {
  kind: 'external'
  externalUrl: string
  mimeType: string
  sourceUrl: string
  uniqueKey: string
  filename: string
  width?: number
  height?: number
  title?: string
  tags?: string[]
  sourceProvider: 'pixiv'
  sourceId: string
  sourcePageUrl: string
  sourceCreatedAt?: string
}

export type FetchResult = LocalFetchResult | ExternalFetchResult

type PixivDiscoveryResponse = {
  body?: {
    illusts?: PixivIllust[]
  }
}

type PixivIllust = {
  id: string
  title?: string
  url: string
  width?: number
  height?: number
  tags?: string[]
  updateDate?: string
}

function getNestedValue(obj: unknown, path: string): unknown {
  return path.split('.').reduce((cur, key) => {
    if (cur == null || typeof cur !== 'object') return undefined
    return (cur as Record<string, unknown>)[key]
  }, obj)
}

function guessMimeType(url: string, contentType?: string): string {
  if (contentType) {
    if (contentType.includes('jpeg') || contentType.includes('jpg')) return 'image/jpeg'
    if (contentType.includes('png')) return 'image/png'
    if (contentType.includes('webp')) return 'image/webp'
    if (contentType.includes('gif')) return 'image/gif'
  }
  const lower = url.toLowerCase()
  if (lower.endsWith('.png')) return 'image/png'
  if (lower.endsWith('.webp')) return 'image/webp'
  if (lower.endsWith('.gif')) return 'image/gif'
  return 'image/jpeg'
}

function extensionFromMimeType(mimeType: string): string {
  switch (mimeType) {
    case 'image/png':
      return 'png'
    case 'image/webp':
      return 'webp'
    case 'image/gif':
      return 'gif'
    default:
      return 'jpg'
  }
}

async function fetchBuffer(url: string): Promise<{ buffer: Buffer; mimeType: string }> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT)
  try {
    const res = await fetch(url, { signal: controller.signal, headers: { 'User-Agent': 'MPic-Crawler/1.0' } })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const contentType = res.headers.get('content-type') || ''
    if (contentType.includes('text/html') || contentType.includes('application/json')) {
      throw new Error(`Not an image: ${contentType}`)
    }
    const arrayBuf = await res.arrayBuffer()
    const buffer = Buffer.from(arrayBuf)
    if (!isImageBuffer(buffer)) {
      throw new Error('Not a valid image (bad magic bytes)')
    }
    return { buffer, mimeType: guessMimeType(url, contentType) }
  } finally {
    clearTimeout(timer)
  }
}

function isImageBuffer(buf: Buffer): boolean {
  if (buf.length < 4) return false
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return true
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return true
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x38) return true
  if (
    buf.length >= 12 &&
    buf[0] === 0x52 &&
    buf[1] === 0x49 &&
    buf[2] === 0x46 &&
    buf[3] === 0x46 &&
    buf[8] === 0x57 &&
    buf[9] === 0x45 &&
    buf[10] === 0x42 &&
    buf[11] === 0x50
  ) {
    return true
  }
  return false
}

async function resolveRedirect(source: CrawlSource): Promise<LocalFetchResult> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT)
  try {
    const res = await fetch(source.url, {
      redirect: 'manual',
      signal: controller.signal,
      headers: { 'User-Agent': 'MPic-Crawler/1.0' },
    })
    const location = res.headers.get('location')
    if (!location) throw new Error('No redirect Location header')
    const imageUrl = location.startsWith('http') ? location : new URL(location, source.url).href
    const { buffer, mimeType } = await fetchBuffer(imageUrl)
    return { kind: 'local', buffer, mimeType, sourceUrl: imageUrl }
  } finally {
    clearTimeout(timer)
  }
}

async function resolveJson(source: CrawlSource): Promise<LocalFetchResult> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT)
  try {
    const res = await fetch(source.url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'MPic-Crawler/1.0' },
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const json = await res.json()
    const imageUrl = getNestedValue(json, source.jsonPath || 'url')
    if (typeof imageUrl !== 'string' || !imageUrl) {
      throw new Error(`Cannot extract image URL from jsonPath: ${source.jsonPath}`)
    }
    const { buffer, mimeType } = await fetchBuffer(imageUrl)
    return { kind: 'local', buffer, mimeType, sourceUrl: imageUrl }
  } finally {
    clearTimeout(timer)
  }
}

async function resolveDirect(source: CrawlSource): Promise<LocalFetchResult> {
  const { buffer, mimeType } = await fetchBuffer(source.url)
  return { kind: 'local', buffer, mimeType, sourceUrl: source.url }
}

async function resolvePixiv(source: CrawlSource, batchSize: number): Promise<ExternalFetchResult[]> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT)

  try {
    const url = new URL(source.url)
    const desiredCount = Math.max(batchSize * 3, 12)
    const existingMax = Number(url.searchParams.get('max')) || 0
    if (existingMax < desiredCount) {
      url.searchParams.set('max', String(desiredCount))
    }
    if (!url.searchParams.get('mode')) {
      url.searchParams.set('mode', 'safe')
    }

    const res = await fetch(url, {
      signal: controller.signal,
      headers: getPixivFetchHeaders(),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)

    const json = await res.json() as PixivDiscoveryResponse
    const illusts = Array.isArray(json.body?.illusts) ? json.body.illusts : []
    const selected = shuffle(
      illusts.filter(illust => typeof illust.id === 'string' && typeof illust.url === 'string' && illust.url.length > 0),
    ).slice(0, batchSize)

    if (selected.length === 0) {
      throw new Error('No Pixiv artworks found')
    }

    return selected.map(illust => {
      const sourceId = `${illust.id}_p0`
      const externalUrl = toRegularPixivUrl(illust.url)
      const mimeType = guessMimeType(externalUrl)
      const ext = extensionFromMimeType(mimeType)
      const tags = normalizeTags(illust.tags)

      return {
        kind: 'external',
        externalUrl,
        mimeType,
        sourceUrl: externalUrl,
        uniqueKey: createHash('sha256').update(`pixiv:${sourceId}`).digest('hex'),
        filename: `pixiv_${sourceId}.${ext}`,
        width: normalizeNumber(illust.width),
        height: normalizeNumber(illust.height),
        title: normalizeText(illust.title),
        ...(tags.length > 0 ? { tags } : {}),
        sourceProvider: 'pixiv',
        sourceId,
        sourcePageUrl: `https://www.pixiv.net/artworks/${illust.id}`,
        ...(normalizeText(illust.updateDate) ? { sourceCreatedAt: normalizeText(illust.updateDate) } : {}),
      }
    })
  } finally {
    clearTimeout(timer)
  }
}

export async function fetchImages(source: CrawlSource, batchSize: number): Promise<FetchResult[]> {
  switch (source.responseType) {
    case 'pixiv':
      return resolvePixiv(source, batchSize)
    case 'redirect':
      return repeatFetch(batchSize, () => resolveRedirect(source))
    case 'json':
      return repeatFetch(batchSize, () => resolveJson(source))
    case 'direct':
      return repeatFetch(batchSize, () => resolveDirect(source))
  }
}

async function repeatFetch<T>(count: number, run: () => Promise<T>): Promise<T[]> {
  const results: T[] = []
  for (let i = 0; i < count; i++) {
    results.push(await run())
  }
  return results
}

function normalizeText(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed || undefined
}

function normalizeNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function normalizeTags(value: unknown): string[] {
  if (!Array.isArray(value)) return []

  const seen = new Set<string>()
  const tags: string[] = []

  for (const item of value) {
    if (typeof item !== 'string') continue
    const tag = item.trim()
    if (!tag || seen.has(tag)) continue
    seen.add(tag)
    tags.push(tag)
  }

  return tags
}

function shuffle<T>(items: T[]): T[] {
  const next = [...items]
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const current = next[i]
    next[i] = next[j] as T
    next[j] = current as T
  }
  return next
}
