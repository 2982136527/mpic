const PIXIV_I = 'https://i.pximg.net/'
const PIXIV_S = 'https://s.pximg.net/'

const PIXIV_ALLOWED_HOSTS = new Set(['i.pximg.net', 's.pximg.net'])
const SIZE_PREFIX_RE = /\/c\/[^/]+\//
const SUFFIX_RE = /_(square1200|custom1200|master1200)\.(jpg|png|gif)$/
const MASTER_SUFFIX_RE = /_(square1200|custom1200)\.(jpg|png|gif)$/

export const PIXIV_FETCH_USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36'

export function isPixivImageUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return PIXIV_ALLOWED_HOSTS.has(url.hostname)
  } catch {
    return false
  }
}

export function toRegularPixivUrl(imageUrl: string): string {
  let url = imageUrl.replace(SIZE_PREFIX_RE, '/')
  url = url.replace('/custom-thumb/', '/img-master/')
  url = url.replace(MASTER_SUFFIX_RE, '_master1200.$2')
  return url
}

export function toOriginalPixivUrl(imageUrl: string): string {
  let url = imageUrl.replace(SIZE_PREFIX_RE, '/')
  url = url.replace('/img-master/', '/img-original/')
  url = url.replace('/custom-thumb/', '/img-original/')
  url = url.replace(SUFFIX_RE, '.$2')
  return url
}

export function replacePixivUrlBase(imageUrl: string, baseI: string, baseS: string): string {
  return imageUrl
    .replaceAll(PIXIV_I, ensureTrailingSlash(baseI))
    .replaceAll(PIXIV_S, ensureTrailingSlash(baseS))
}

export function buildPixivProxyUrl(imageUrl: string): string {
  return `/api/pixiv/proxy?url=${encodeURIComponent(imageUrl)}`
}

export function getPixivFetchHeaders(extra?: HeadersInit): HeadersInit {
  return {
    Referer: 'https://www.pixiv.net/',
    'User-Agent': PIXIV_FETCH_USER_AGENT,
    ...extra,
  }
}

function ensureTrailingSlash(value: string): string {
  return value.endsWith('/') ? value : `${value}/`
}
