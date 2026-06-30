import { after, NextResponse, type NextRequest } from 'next/server'
import { appendAccessLog } from '@/lib/services/access-log-service'
import { createAccessLogEntry } from '@/lib/access-tracking'
import { incrementVisitCounter } from '@/lib/services/visit-counter-service'

export async function POST(request: NextRequest) {
  let path: string | undefined

  try {
    const body = await request.json().catch(() => null)
    path = typeof body?.path === 'string' ? body.path : undefined
  } catch {
    path = undefined
  }

  after(async () => {
    await incrementVisitCounter().catch(() => {})
    try {
      const entry = await createAccessLogEntry(request, {
        type: 'page_view',
        path,
        status: 204,
        detail: 'public_page_view',
      })
      await appendAccessLog(entry)
    } catch (error) {
      console.error('[api][visit][access]', error)
    }
  })

  return new NextResponse(null, { status: 204 })
}
