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
    const arrayBuf = await res.arrayBuffer()
    const contentType = res.headers.get('content-type') || ''
    return { buffer: Buffer.from(arrayBuf), mimeType: guessMimeType(url, contentType) }
  } finally {
    clearTimeout(timer)
  }
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
