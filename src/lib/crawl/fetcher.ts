import type { CrawlSource } from '@/types/crawl'

const FETCH_TIMEOUT = 15_000

type FetchResult = {
  buffer: Buffer
  mimeType: string
  sourceUrl: string
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

async function fetchBuffer(url: string): Promise<{ buffer: Buffer; mimeType: string }> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT)
  try {
    const res = await fetch(url, { signal: controller.signal, headers: { 'User-Agent': 'MPic-Crawler/1.0' } })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const contentType = res.headers.get('content-type') || ''
    // Reject non-image responses
    if (contentType.includes('text/html') || contentType.includes('application/json')) {
      throw new Error(`Not an image: ${contentType}`)
    }
    const arrayBuf = await res.arrayBuffer()
    const buffer = Buffer.from(arrayBuf)
    // Verify image magic bytes
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
  // JPEG: FF D8 FF
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return true
  // PNG: 89 50 4E 47
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return true
  // GIF: 47 49 46 38
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x38) return true
  // WebP: RIFF....WEBP
  if (buf.length >= 12 && buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
      buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50) return true
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
    const { buffer, mimeType } = await fetchBuffer(imageUrl)
    return { buffer, mimeType, sourceUrl: imageUrl }
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
    if (typeof imageUrl !== 'string' || !imageUrl) throw new Error(`Cannot extract image URL from jsonPath: ${source.jsonPath}`)
    const { buffer, mimeType } = await fetchBuffer(imageUrl)
    return { buffer, mimeType, sourceUrl: imageUrl }
  } finally {
    clearTimeout(timer)
  }
}

async function resolveDirect(source: CrawlSource): Promise<FetchResult> {
  const { buffer, mimeType } = await fetchBuffer(source.url)
  return { buffer, mimeType, sourceUrl: source.url }
}

export async function fetchImage(source: CrawlSource): Promise<FetchResult> {
  switch (source.responseType) {
    case 'redirect':
      return resolveRedirect(source)
    case 'json':
      return resolveJson(source)
    case 'direct':
      return resolveDirect(source)
  }
}
