import { after, NextRequest, NextResponse } from 'next/server'
import { getRandomPublicImage } from '@/lib/services/image-service'
import { getPreferredPublicImageSource } from '@/lib/image-links'
import { getSettings } from '@/lib/services/settings-service'
import { appendAccessLog } from '@/lib/services/access-log-service'
import { createAccessLogEntry } from '@/lib/access-tracking'

export async function GET(request: NextRequest) {
  try {
    const settings = await getSettings()
    if (!settings.enableRandomApi) {
      const response = NextResponse.json({ error: 'Random image API is disabled' }, { status: 403 })
      logRandomAccess(request, { status: 403, detail: 'disabled' })
      return response
    }

    const result = await getRandomPublicImage()
    if (!result) {
      const response = NextResponse.json({ error: 'No public images available' }, { status: 404 })
      logRandomAccess(request, { status: 404, detail: 'empty' })
      return response
    }

    const format = request.nextUrl.searchParams.get('format')

    if (format === 'json') {
      const response = NextResponse.json({
        id: result.record.id,
        filename: result.record.filename,
        title: result.record.title,
        width: result.record.width,
        height: result.record.height,
        mimeType: result.record.mimeType,
        storageKind: result.record.storageKind,
        sourceProvider: result.record.sourceProvider,
        sourcePageUrl: result.record.sourcePageUrl,
        tags: result.record.tags || [],
        links: result.links,
      })
      logRandomAccess(request, {
        status: 200,
        imageId: result.record.id,
        imageTitle: result.record.title || result.record.filename,
        detail: 'format=json',
      })
      return response
    }

    const url = getPreferredPublicImageSource(result.links)
    if (!url) {
      const response = NextResponse.json({ error: 'No public image url available' }, { status: 500 })
      logRandomAccess(request, {
        status: 500,
        imageId: result.record.id,
        imageTitle: result.record.title || result.record.filename,
        detail: 'missing_public_url',
      })
      return response
    }

    const redirectUrl = url.startsWith('http') ? url : new URL(url, request.nextUrl.origin).toString()
    const response = NextResponse.redirect(redirectUrl, 302)
    logRandomAccess(request, {
      status: 302,
      imageId: result.record.id,
      imageTitle: result.record.title || result.record.filename,
      detail: 'format=redirect',
    })
    return response
  } catch (error) {
    console.error('[api][random][GET]', error)
    const response = NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    logRandomAccess(request, { status: 500, detail: 'internal_error' })
    return response
  }
}

function logRandomAccess(
  request: NextRequest,
  input: { status: number; imageId?: string; imageTitle?: string; detail?: string },
) {
  after(async () => {
    try {
      const entry = await createAccessLogEntry(request, {
        type: 'random_api',
        status: input.status,
        imageId: input.imageId,
        imageTitle: input.imageTitle,
        detail: input.detail,
      })
      await appendAccessLog(entry)
    } catch (error) {
      console.error('[api][random][access]', error)
    }
  })
}
