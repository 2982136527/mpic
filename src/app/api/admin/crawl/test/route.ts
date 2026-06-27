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
          // Try to find an image URL in common paths
          const imagePaths = ['data.0.urls.original', 'data.0.url', 'data.url', 'imgurl', 'url', 'img', 'image', 'src']
          let foundPath = ''
          let foundUrl = ''
          for (const path of imagePaths) {
            const val = getNestedValue(json, path)
            if (typeof val === 'string' && (val.startsWith('http://') || val.startsWith('https://'))) {
              foundPath = path
              foundUrl = val
              break
            }
          }
          return ok(requestId, {
            responseType: 'json',
            status: res.status,
            contentType,
            jsonPreview: JSON.stringify(json).slice(0, 500),
            suggestedPath: foundPath,
            suggestedUrl: foundUrl,
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

function getNestedValue(obj: unknown, path: string): unknown {
  return path.split('.').reduce((cur, key) => {
    if (cur == null || typeof cur !== 'object') return undefined
    return (cur as Record<string, unknown>)[key]
  }, obj)
}
