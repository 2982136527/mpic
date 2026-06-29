// Simple in-memory sliding window rate limiter
// NOTE: Resets on Vercel cold start. Fine for stopping casual scraping.
// For production-grade rate limiting, use edge middleware + external store (Redis/Upstash).

type Window = {
  count: number
  resetAt: number
}

const windows = new Map<string, Window>()

const WINDOW_MS = 60_000       // 1 minute window
const MAX_REQUESTS = 120       // max requests per window

// Clean up stale entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, win] of windows) {
    if (win.resetAt <= now) windows.delete(key)
  }
}, 300_000)

export function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = windows.get(ip)

  if (!entry || entry.resetAt <= now) {
    // New window
    windows.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    return false
  }

  entry.count++
  if (entry.count > MAX_REQUESTS) {
    return true
  }

  return false
}
