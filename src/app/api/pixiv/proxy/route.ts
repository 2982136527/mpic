import { NextRequest, NextResponse } from 'next/server'
import { getPixivFetchHeaders, isPixivImageUrl } from '@/lib/pixiv'

const FORWARDED_REQUEST_HEADERS = [
  'accept',
  'accept-language',
  'cache-control',
  'if-modified-since',
  'if-none-match',
  'if-range',
  'range',
]

const FORWARDED_RESPONSE_HEADERS = [
  'accept-ranges',
  'cache-control',
  'content-disposition',
  'content-length',
  'content-range',
  'content-type',
  'etag',
  'expires',
  'last-modified',
]

export async function GET(request: NextRequest) {
  const imageUrl = request.nextUrl.searchParams.get('url') || ''
  if (!imageUrl || !isPixivImageUrl(imageUrl)) {
    return NextResponse.json({ error: 'Invalid Pixiv image url' }, { status: 400 })
  }

  const requestHeaders: Record<string, string> = {}
  for (const header of FORWARDED_REQUEST_HEADERS) {
    const value = request.headers.get(header)
    if (value) requestHeaders[header] = value
  }

  const response = await fetch(imageUrl, {
    headers: getPixivFetchHeaders(requestHeaders),
  })

  const headers = new Headers()
  for (const header of FORWARDED_RESPONSE_HEADERS) {
    const value = response.headers.get(header)
    if (value) headers.set(header, value)
  }
  if (!headers.has('cache-control')) {
    headers.set('cache-control', 'public, max-age=86400, s-maxage=31536000, stale-while-revalidate=86400')
  }

  return new NextResponse(response.body, {
    status: response.status,
    headers,
  })
}
