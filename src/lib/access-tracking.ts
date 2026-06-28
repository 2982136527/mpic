import { createHash } from 'node:crypto'
import { getToken } from 'next-auth/jwt'
import type { NextRequest } from 'next/server'
import { isAdminLogin } from '@/lib/api/permissions'
import type { AccessActorRole, AccessDeviceType, AccessLogEntry, AccessLogType } from '@/types/access'

type AccessLogDraft = {
  type: AccessLogType
  path?: string
  method?: string
  status: number
  imageId?: string
  imageTitle?: string
  detail?: string
}

export async function createAccessLogEntry(
  request: NextRequest,
  input: AccessLogDraft,
): Promise<Omit<AccessLogEntry, 'id' | 'createdAt'>> {
  const token = await getToken({ req: request, secret: process.env.AUTH_SECRET })
  const userAgent = trimValue(request.headers.get('user-agent'))
  const ip = getClientIp(request)
  const visitorKey = ip || userAgent ? hashVisitorKey(`${ip || ''}|${userAgent || ''}`) : undefined
  const { browser, os, deviceType } = parseUserAgent(userAgent || '')
  const actorLogin = typeof token?.login === 'string' ? token.login : undefined
  const actorGithubId = typeof token?.githubId === 'string' ? token.githubId : undefined
  const actorRole: AccessActorRole = actorLogin ? (isAdminLogin(actorLogin) ? 'admin' : 'user') : 'guest'

  return {
    type: input.type,
    path: normalizePath(input.path || `${request.nextUrl.pathname}${request.nextUrl.search}`),
    method: input.method || request.method,
    status: input.status,
    ip,
    visitorKey,
    referer: trimValue(request.headers.get('referer')),
    userAgent,
    browser,
    os,
    deviceType,
    actorRole,
    actorLogin,
    actorGithubId,
    imageId: input.imageId,
    imageTitle: trimValue(input.imageTitle),
    detail: trimValue(input.detail),
  }
}

function getClientIp(request: NextRequest): string | undefined {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim()
    if (first) return first.slice(0, 128)
  }

  const direct = request.headers.get('x-real-ip')
    || request.headers.get('cf-connecting-ip')
    || request.headers.get('x-vercel-forwarded-for')
    || request.headers.get('true-client-ip')

  return trimValue(direct)
}

function hashVisitorKey(value: string): string {
  return createHash('sha1').update(value).digest('hex').slice(0, 16)
}

function normalizePath(value: string): string {
  const trimmed = trimValue(value) || '/'
  return trimmed.startsWith('/') ? trimmed.slice(0, 500) : `/${trimmed.slice(0, 499)}`
}

function trimValue(value: string | null | undefined): string | undefined {
  if (!value) return undefined
  const trimmed = value.trim()
  return trimmed ? trimmed.slice(0, 500) : undefined
}

function parseUserAgent(userAgent: string): { browser?: string; os?: string; deviceType: AccessDeviceType } {
  const ua = userAgent.toLowerCase()

  const deviceType: AccessDeviceType = /bot|spider|crawler|preview|facebookexternalhit|slurp|curl|wget/.test(ua)
    ? 'bot'
    : /ipad|tablet/.test(ua)
      ? 'tablet'
      : /mobi|iphone|android/.test(ua)
        ? 'mobile'
        : ua
          ? 'desktop'
          : 'unknown'

  const browser = /edg\//.test(ua)
    ? 'Edge'
    : /chrome\//.test(ua) && !/edg\//.test(ua)
      ? 'Chrome'
      : /firefox\//.test(ua)
        ? 'Firefox'
        : /safari\//.test(ua) && !/chrome\//.test(ua)
          ? 'Safari'
          : /opr\//.test(ua) || /opera/.test(ua)
            ? 'Opera'
            : undefined

  const os = /windows/.test(ua)
    ? 'Windows'
    : /iphone|ipad|ios/.test(ua)
      ? 'iOS'
      : /android/.test(ua)
        ? 'Android'
        : /mac os|macintosh/.test(ua)
          ? 'macOS'
          : /linux/.test(ua)
            ? 'Linux'
            : undefined

  return { browser, os, deviceType }
}
