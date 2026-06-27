import { NextRequest } from 'next/server'
import { requireSession } from '@/lib/api/session'
import { uploadImage, buildImageLinks } from '@/lib/services/image-service'
import { getUser } from '@/lib/services/user-service'
import { appendLog } from '@/lib/services/log-service'
import { createRequestId, ok, fail } from '@/lib/api/response'
import { HttpError } from '@/lib/api/errors'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export async function POST(request: NextRequest) {
  const requestId = createRequestId()

  try {
    const { login } = await requireSession()

    const user = await getUser(login)
    if (user?.banned) {
      return fail(requestId, 403, 'BANNED', 'Your account has been suspended')
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return fail(requestId, 400, 'MISSING_FILE', 'No file provided')
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return fail(requestId, 400, 'INVALID_TYPE', `Unsupported file type. Allowed: ${ALLOWED_TYPES.join(', ')}`)
    }

    const quotaUsed = user?.totalSize || 0
    const quotaMax = user?.quotaBytes || 0
    if (quotaMax > 0 && quotaUsed + file.size > quotaMax) {
      return fail(requestId, 400, 'QUOTA_EXCEEDED', 'Storage quota exceeded')
    }

    const albumId = (formData.get('albumId') as string) || undefined
    const isPublicRaw = formData.get('isPublic') as string | null
    const isPublic = isPublicRaw !== null ? isPublicRaw === 'true' : undefined

    const buffer = Buffer.from(await file.arrayBuffer())

    const { record, isDuplicate } = await uploadImage({
      buffer,
      filename: file.name,
      mimeType: file.type,
      uploaderLogin: login,
      albumId,
      isPublic,
    })

    await appendLog({
      action: 'upload',
      actorLogin: login,
      targetId: record.id,
      detail: `${record.filename} (${isDuplicate ? 'duplicate' : 'new'})`,
    })

    return ok(requestId, {
      image: record,
      links: buildImageLinks(record),
      isDuplicate,
    })
  } catch (error) {
    if (error instanceof HttpError) {
      return fail(requestId, error.status, error.code, error.message)
    }
    console.error('[api][upload][POST]', requestId, error)
    return fail(requestId, 500, 'INTERNAL_ERROR', 'Upload failed')
  }
}
