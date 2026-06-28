import { NextRequest, NextResponse } from 'next/server'
import { getRandomPublicImage } from '@/lib/services/image-service'
import { getPreferredPublicImageSource } from '@/lib/image-links'

export async function GET(request: NextRequest) {
  try {
    const result = await getRandomPublicImage()
    if (!result) {
      return NextResponse.json({ error: 'No public images available' }, { status: 404 })
    }

    const format = request.nextUrl.searchParams.get('format')

    if (format === 'json') {
      return NextResponse.json({
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
    }

    const url = getPreferredPublicImageSource(result.links)
    if (!url) {
      return NextResponse.json({ error: 'No public image url available' }, { status: 500 })
    }

    const redirectUrl = url.startsWith('http') ? url : new URL(url, request.nextUrl.origin).toString()
    return NextResponse.redirect(redirectUrl, 302)
  } catch (error) {
    console.error('[api][random][GET]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
