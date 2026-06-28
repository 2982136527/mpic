import type { CrawlSource } from '@/types/crawl'
import { getPixivFetchHeaders, toRegularPixivUrl } from '@/lib/pixiv'

const FETCH_TIMEOUT = 15_000
const PIXIV_HIGH_SCORE_MIN_RATING = 1000
const PIXIV_HIGH_SCORE_MODES = ['daily', 'weekly', 'monthly'] as const
const PIXIV_HIGH_SCORE_PAGES = [2, 3] as const

export type FetchResult = {
  kind: 'local'
  buffer: Buffer
  mimeType: string
  sourceUrl: string
  filename: string
  width?: number
  height?: number
  title?: string
  tags?: string[]
  sourceProvider?: 'pixiv'
  sourceId?: string
  sourcePageUrl?: string
  sourceCreatedAt?: string
}

type PixivDiscoveryResponse = {
  body?: {
    illusts?: PixivDiscoveryIllust[]
  }
}

type PixivRankingResponse = {
  contents?: PixivRankingIllust[]
}

type PixivDiscoveryIllust = {
  id: string
  title?: string
  url: string
  width?: number
  height?: number
  tags?: string[]
  illustType?: number
  createDate?: string
  updateDate?: string
}

type PixivRankingIllust = {
  illust_id?: number | string
  title?: string
  url?: string
  width?: number
  height?: number
  tags?: string[]
  illust_type?: number | string
  rating_count?: number | string
  illust_upload_timestamp?: number | string
  date?: string
}

type NormalizedPixivIllust = {
  id: string
  title?: string
  url: string
  width?: number
  height?: number
  tags?: string[]
  updateDate?: string
  illustType?: number
  ratingCount?: number
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

export async function fetchImageBuffer(url: string, headers?: HeadersInit): Promise<{ buffer: Buffer; mimeType: string }> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT)
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'MPic-Crawler/1.0',
        ...(headers || {}),
      },
    })
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

async function resolveRedirect(source: CrawlSource): Promise<FetchResult> {
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
    const { buffer, mimeType } = await fetchImageBuffer(imageUrl)
    return {
      kind: 'local',
      buffer,
      mimeType,
      sourceUrl: imageUrl,
      filename: buildSourceFilename(source.id, mimeType),
    }
  } finally {
    clearTimeout(timer)
  }
}

async function resolveJson(source: CrawlSource): Promise<FetchResult> {
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
    const { buffer, mimeType } = await fetchImageBuffer(imageUrl)
    return {
      kind: 'local',
      buffer,
      mimeType,
      sourceUrl: imageUrl,
      filename: buildSourceFilename(source.id, mimeType),
    }
  } finally {
    clearTimeout(timer)
  }
}

async function resolveDirect(source: CrawlSource): Promise<FetchResult> {
  const { buffer, mimeType } = await fetchImageBuffer(source.url)
  return {
    kind: 'local',
    buffer,
    mimeType,
    sourceUrl: source.url,
    filename: buildSourceFilename(source.id, mimeType),
  }
}

async function resolvePixiv(source: CrawlSource, batchSize: number): Promise<FetchResult[]> {
  if (source.id === 'builtin_pixiv_top_rated') {
    return resolvePixivHighScore(source, batchSize)
  }

  const url = new URL(source.url)
  if (url.pathname === '/ajax/illust/discovery') {
    const desiredCount = Math.max(batchSize * 3, 12)
    const existingMax = Number(url.searchParams.get('max')) || 0
    if (existingMax < desiredCount) {
      url.searchParams.set('max', String(desiredCount))
    }
    if (!url.searchParams.get('mode')) {
      url.searchParams.set('mode', 'safe')
    }
  }
  if (url.pathname === '/ranking.php') {
    if (!url.searchParams.get('content')) {
      url.searchParams.set('content', 'illust')
    }
    if (!url.searchParams.get('format')) {
      url.searchParams.set('format', 'json')
    }
  }

  const json = await fetchPixivJson<PixivDiscoveryResponse | PixivRankingResponse>(url)
  const illusts = extractPixivIllusts(json)
  const selected = selectPixivIllustrations(illusts, batchSize)

  if (selected.length === 0) {
    throw new Error('No Pixiv artworks found')
  }

  return fetchPixivResults(selected)
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

async function resolvePixivHighScore(source: CrawlSource, batchSize: number): Promise<FetchResult[]> {
  const baseUrl = new URL(source.url)
  const payloads = await Promise.all(
    PIXIV_HIGH_SCORE_MODES.flatMap(mode =>
      PIXIV_HIGH_SCORE_PAGES.map(async page => {
        const url = new URL(baseUrl)
        url.searchParams.set('mode', mode)
        url.searchParams.set('content', 'illust')
        url.searchParams.set('format', 'json')
        url.searchParams.set('p', String(page))
        return fetchPixivJson<PixivRankingResponse>(url)
      }),
    ),
  )

  const allIllustrations = dedupePixivIllustrations(
    payloads.flatMap(payload => extractPixivIllusts(payload)),
  )
  const highScoreIllustrations = allIllustrations.filter(illust =>
    illust.illustType === 0 && (illust.ratingCount || 0) >= PIXIV_HIGH_SCORE_MIN_RATING,
  )
  const selectedPool = highScoreIllustrations.length >= batchSize
    ? highScoreIllustrations
    : allIllustrations.filter(illust => illust.illustType === 0)
  const selected = shuffle(selectedPool).slice(0, batchSize)

  if (selected.length === 0) {
    throw new Error('No high-score Pixiv illustrations found')
  }

  return fetchPixivResults(selected)
}

function extractPixivIllusts(payload: PixivDiscoveryResponse | PixivRankingResponse): NormalizedPixivIllust[] {
  const discoveryIllusts = Array.isArray((payload as PixivDiscoveryResponse).body?.illusts)
    ? (payload as PixivDiscoveryResponse).body?.illusts || []
    : []
  if (discoveryIllusts.length > 0) {
    return discoveryIllusts
      .map(normalizeDiscoveryIllust)
      .filter((illust): illust is NormalizedPixivIllust => Boolean(illust))
  }

  const rankingIllusts = Array.isArray((payload as PixivRankingResponse).contents)
    ? (payload as PixivRankingResponse).contents || []
    : []
  return rankingIllusts
    .map(normalizeRankingIllust)
    .filter((illust): illust is NormalizedPixivIllust => Boolean(illust))
}

function normalizeDiscoveryIllust(illust: PixivDiscoveryIllust): NormalizedPixivIllust | null {
  const id = normalizeText(illust.id)
  const url = normalizeText(illust.url)
  if (!id || !url) return null

  return {
    id,
    title: normalizeText(illust.title),
    url,
    width: normalizeNumber(illust.width),
    height: normalizeNumber(illust.height),
    tags: normalizeTags(illust.tags),
    updateDate: normalizeTimestamp(illust.updateDate || illust.createDate),
    illustType: normalizeInteger(illust.illustType),
  }
}

function normalizeRankingIllust(illust: PixivRankingIllust): NormalizedPixivIllust | null {
  const id = normalizeText(String(illust.illust_id || ''))
  const url = normalizeText(illust.url)
  if (!id || !url) return null

  return {
    id,
    title: normalizeText(illust.title),
    url,
    width: normalizeNumber(illust.width),
    height: normalizeNumber(illust.height),
    tags: normalizeTags(illust.tags),
    updateDate: normalizeTimestamp(illust.illust_upload_timestamp) || normalizeTimestamp(illust.date),
    illustType: normalizeInteger(illust.illust_type),
    ratingCount: normalizeInteger(illust.rating_count),
  }
}

function selectPixivIllustrations(illusts: NormalizedPixivIllust[], batchSize: number): NormalizedPixivIllust[] {
  return shuffle(
    illusts.filter(illust => illust.id.length > 0 && illust.url.length > 0 && illust.illustType === 0),
  ).slice(0, batchSize)
}

function dedupePixivIllustrations(illusts: NormalizedPixivIllust[]): NormalizedPixivIllust[] {
  const map = new Map<string, NormalizedPixivIllust>()
  for (const illust of illusts) {
    if (!map.has(illust.id)) {
      map.set(illust.id, illust)
    }
  }
  return Array.from(map.values())
}

async function fetchPixivResults(illusts: NormalizedPixivIllust[]): Promise<FetchResult[]> {
  const settled = await Promise.allSettled(
    illusts.map(async illust => {
      const sourceId = `${illust.id}_p0`
      const imageUrl = toRegularPixivUrl(illust.url)
      const { buffer, mimeType } = await fetchImageBuffer(imageUrl, getPixivFetchHeaders())
      const ext = extensionFromMimeType(mimeType)
      const tags = normalizeTags(illust.tags)

      return {
        kind: 'local' as const,
        buffer,
        mimeType,
        sourceUrl: imageUrl,
        filename: `pixiv_${sourceId}.${ext}`,
        width: normalizeNumber(illust.width),
        height: normalizeNumber(illust.height),
        title: normalizeText(illust.title),
        ...(tags.length > 0 ? { tags } : {}),
        sourceProvider: 'pixiv' as const,
        sourceId,
        sourcePageUrl: `https://www.pixiv.net/artworks/${illust.id}`,
        ...(normalizeText(illust.updateDate) ? { sourceCreatedAt: normalizeText(illust.updateDate) } : {}),
      }
    }),
  )

  const results = settled.flatMap(result => (
    result.status === 'fulfilled' ? [result.value as FetchResult] : []
  ))

  if (results.length === 0) {
    throw new Error('Failed to fetch Pixiv image files')
  }

  return results
}

async function fetchPixivJson<T>(url: URL): Promise<T> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT)
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: getPixivFetchHeaders(),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json() as T
  } finally {
    clearTimeout(timer)
  }
}

function normalizeInteger(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.trunc(value)
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return Math.trunc(parsed)
  }
  return undefined
}

function normalizeTimestamp(value: unknown): string | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return new Date(value * 1000).toISOString()
  }
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return undefined
    if (/^\d+$/.test(trimmed)) {
      return new Date(Number(trimmed) * 1000).toISOString()
    }
    const date = new Date(trimmed)
    if (!Number.isNaN(date.getTime())) {
      return date.toISOString()
    }
  }
  return normalizeText(value)
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

function buildSourceFilename(sourceId: string, mimeType: string): string {
  return `crawl_${sourceId}_${Date.now()}.${extensionFromMimeType(mimeType)}`
}
