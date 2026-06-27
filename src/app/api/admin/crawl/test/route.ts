import { NextRequest } from 'next/server'
import { requireAdminSession } from '@/lib/api/session'
import { createRequestId, ok, fail } from '@/lib/api/response'
import { HttpError } from '@/lib/api/errors'

export async function POST(request: NextRequest) {
  const requestId = createRequestId()

  try {
    await requireAdminSession()
    const { url } = await request.json()

    if (!url || typeof url !== 'string') {
      return fail(requestId, 400, 'BAD_REQUEST', 'URL is required')
    }

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 10_000)

    try {
      // First request: don't follow redirects
      const res = await fetch(url, {
        redirect: 'manual',
        signal: controller.signal,
        headers: { 'User-Agent': 'MPic-Crawler/1.0' },
      })
      clearTimeout(timer)

      const contentType = res.headers.get('content-type') || ''
      const location = res.headers.get('location')

      // Check if it's a redirect
      if (res.status >= 300 && res.status < 400 && location) {
        return ok(requestId, {
          responseType: 'redirect',
          status: res.status,
          location,
          preview: location,
        })
      }

      // Check if response is JSON
      if (contentType.includes('json') || contentType.includes('text/plain')) {
        try {
          const text = await res.text()
          const json = JSON.parse(text)
          // Recursively search for the first image URL in the JSON tree
          const found = findImageUrl(json, '')
          return ok(requestId, {
            responseType: 'json',
            status: res.status,
            contentType,
            jsonPreview: JSON.stringify(json).slice(0, 500),
            suggestedPath: found?.path || '',
            suggestedUrl: found?.url || '',
          })
        } catch {
          // Not valid JSON, fall through
        }
      }

      // Check if response is an image
      if (contentType.includes('image/')) {
        return ok(requestId, {
          responseType: 'direct',
          status: res.status,
          contentType,
          preview: `直接返回图片 (${contentType})`,
        })
      }

      // Unknown
      return ok(requestId, {
        responseType: 'unknown',
        status: res.status,
        contentType,
        preview: `未知响应类型: ${contentType}`,
      })
    } catch (err) {
      clearTimeout(timer)
      throw err
    }
  } catch (error) {
    if (error instanceof HttpError) {
      return fail(requestId, error.status, error.code, error.message)
    }
    const msg = error instanceof Error ? error.message : 'Unknown error'
    console.error('[api][admin][crawl][test]', requestId, error)
    return fail(requestId, 500, 'INTERNAL_ERROR', `测试失败: ${msg}`)
  }
}

const IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.svg', '.ico']

function isImageUrl(val: string): boolean {
  if (!val.startsWith('http://') && !val.startsWith('https://')) return false
  const lower = val.toLowerCase()
  return IMAGE_EXTS.some(ext => lower.includes(ext)) || lower.includes('image') || lower.includes('img')
}

function findImageUrl(obj: unknown, path: string): { path: string; url: string } | null {
  if (obj == null || typeof obj !== 'object') return null

  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      const result = findImageUrl(obj[i], path ? `${path}.${i}` : String(i))
      if (result) return result
    }
    return null
  }

  for (const [key, val] of Object.entries(obj as Record<string, unknown>)) {
    const currentPath = path ? `${path}.${key}` : key
    if (typeof val === 'string' && isImageUrl(val)) {
      return { path: currentPath, url: val }
    }
    if (typeof val === 'object' && val !== null) {
      const result = findImageUrl(val, currentPath)
      if (result) return result
    }
  }

  return null
}
