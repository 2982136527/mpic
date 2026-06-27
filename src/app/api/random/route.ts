import { NextRequest, NextResponse } from 'next/server'
import { getRandomPublicImage } from '@/lib/services/image-service'

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
        width: result.record.width,
        height: result.record.height,
        mimeType: result.record.mimeType,
        links: result.links,
      })
    }

    // Default: 302 redirect to CDN image
    const url = result.links.customCdn || result.links.cdn
    return NextResponse.redirect(url, 302)
  } catch (error) {
    console.error('[api][random][GET]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
