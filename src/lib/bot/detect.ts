// Known crawl tools — these are definitely bots
const KNOWN_BOTS = new Set([
  'curl', 'wget', 'python-urllib', 'python-requests', 'python-httpx',
  'go-http-client', 'scrapy', 'okhttp', 'axios', 'node-fetch',
  'aiohttp', 'httpx', 'requests', 'java/',
  'php/', 'ruby', 'perl', 'libwww', 'lwp',
  'scrape', 'scanner',
])

// Search engines & legit crawlers — these should NOT be blocked
const ALLOWED_BOTS = new Set([
  'googlebot', 'bingbot', 'slurp', 'duckduckbot', 'baiduspider',
  'yandexbot', 'facebookexternalhit', 'twitterbot', 'rogerbot',
  'linkedinbot', 'embedly', 'quora link preview', 'showyoubot',
  'outbrain', 'pinterest', 'slackbot', 'vkShare', 'w3c_validator',
  'applebot', 'semrushbot', 'ahrefsbot', 'dotbot',
])

const BROWSER_LIKE_HEADERS = ['accept-language', 'accept-encoding', 'sec-fetch-site', 'sec-fetch-mode', 'sec-ch-ua']

export function isLikelyBot(request: Request): boolean {
  const ua = (request.headers.get('user-agent') || '').toLowerCase()
  const accept = (request.headers.get('accept') || '').toLowerCase()

  // 0. No User-Agent at all → suspicious, block
  if (!ua) return true

  // 0.5. Known search engines / legit crawlers → allow
  for (const allowed of ALLOWED_BOTS) {
    if (ua.includes(allowed)) return false
  }

  // 1. Known bot User-Agent patterns (curl, wget, python-requests, etc.)
  for (const bot of KNOWN_BOTS) {
    if (ua.includes(bot)) return true
  }

  // 2. Check for browser-like headers
  //    Real browsers always send at least 2 of these; simple scrapers send 0-1
  let browserHeaders = 0
  for (const h of BROWSER_LIKE_HEADERS) {
    if (request.headers.get(h)) browserHeaders++
  }
  if (browserHeaders >= 2) return false

  // 3. UA doesn't look like a browser and missing browser headers → likely bot
  const looksLikeBrowser = ua.includes('mozilla') || ua.includes('chrome') || ua.includes('safari') || ua.includes('firefox') || ua.includes('edge') || ua.includes('opera')
  return !looksLikeBrowser
}

export function getClientIp(request: Request): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown'
}
