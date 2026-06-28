import { after, NextResponse, type NextRequest } from 'next/server'
import { appendAccessLog } from '@/lib/services/access-log-service'
import { createAccessLogEntry } from '@/lib/access-tracking'

export async function POST(request: NextRequest) {
  let path = request.nextUrl.searchParams.get('path') || '/'

  try {
    const body = await request.json()
    if (typeof body?.path === 'string' && body.path.trim()) {
      path = body.path
    }
  } catch {
    // Ignore malformed body and keep the fallback path.
  }

  after(async () => {
    try {
      const entry = await createAccessLogEntry(request, {
        type: 'page_view',
        path,
        status: 204,
        detail: 'public_page_view',
      })
      await appendAccessLog(entry)
    } catch (error) {
      console.error('[api][visit][POST]', error)
    }
  })

  return new NextResponse(null, { status: 204 })
}
