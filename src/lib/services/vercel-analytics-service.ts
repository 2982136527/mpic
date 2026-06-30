const VERCEL_API = 'https://api.vercel.com/v1/webanalytics'

type VercelAnalyticsResponse = {
  data?: { total?: number }
  error?: { message?: string }
}

let _cachedCount: number | null = null
let _cachedAt = 0
const CACHE_TTL = 120_000 // 2 min cache

export async function getPageViewCount(): Promise<number | null> {
  const token = process.env.VERCEL_ANALYTICS_TOKEN
  if (!token) return null

  if (_cachedCount !== null && Date.now() - _cachedAt < CACHE_TTL) {
    return _cachedCount
  }

  const teamId = process.env.VERCEL_TEAM_ID || ''
  const projectId = process.env.VERCEL_PROJECT_ID || ''

  try {
    const url = `${VERCEL_API}/events?teamId=${encodeURIComponent(teamId)}&projectId=${encodeURIComponent(projectId)}&filter=event:page_view`
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
    if (!res.ok) return null

    const data = await res.json() as VercelAnalyticsResponse
    const count = data?.data?.total ?? null
    if (count !== null) {
      _cachedCount = count
      _cachedAt = Date.now()
    }
    return count
  } catch {
    return _cachedCount
  }
}
