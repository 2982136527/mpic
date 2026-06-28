import { appendFileSync } from 'node:fs'

const {
  IMAGE_GITHUB_OWNER,
  IMAGE_GITHUB_REPO,
  IMAGE_GITHUB_BRANCH = 'main',
  IMAGE_GITHUB_TOKEN,
  GITHUB_OUTPUT,
} = process.env

main().catch(error => {
  console.error('[crawl][chain] unexpected error', error)
  setOutput('enabled', 'unknown')
  setOutput('should_dispatch', 'true')
  setOutput('reason', 'unexpected_error')
  process.exitCode = 0
})

async function main() {
  if (!IMAGE_GITHUB_OWNER || !IMAGE_GITHUB_REPO || !IMAGE_GITHUB_TOKEN) {
    console.warn('[crawl][chain] missing GitHub env, keep chain alive conservatively')
    setOutput('enabled', 'unknown')
    setOutput('should_dispatch', 'true')
    setOutput('reason', 'missing_env')
    return
  }

  try {
    const response = await fetch(
      `https://api.github.com/repos/${encodeURIComponent(IMAGE_GITHUB_OWNER)}/${encodeURIComponent(IMAGE_GITHUB_REPO)}/contents/data/crawl-config.json?ref=${encodeURIComponent(IMAGE_GITHUB_BRANCH)}`,
      {
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${IMAGE_GITHUB_TOKEN}`,
          'X-GitHub-Api-Version': '2022-11-28',
        },
        cache: 'no-store',
      },
    )

    if (!response.ok) {
      console.warn(`[crawl][chain] failed to read crawl-config status=${response.status}, keep chain alive`)
      setOutput('enabled', 'unknown')
      setOutput('should_dispatch', 'true')
      setOutput('reason', `config_http_${response.status}`)
      return
    }

    const payload = await response.json()
    const raw = String(payload.content || '').replace(/\n/g, '')
    const text = Buffer.from(raw, 'base64').toString('utf8')
    const config = JSON.parse(text)
    const enabled = config?.enabled === true

    setOutput('enabled', enabled ? 'true' : 'false')
    setOutput('should_dispatch', enabled ? 'true' : 'false')
    setOutput('reason', enabled ? 'config_enabled' : 'config_disabled')
    console.log(`[crawl][chain] enabled=${enabled}`)
  } catch (error) {
    console.warn('[crawl][chain] failed to resolve crawl config, keep chain alive', error)
    setOutput('enabled', 'unknown')
    setOutput('should_dispatch', 'true')
    setOutput('reason', 'config_parse_failed')
  }
}

function setOutput(key, value) {
  if (!GITHUB_OUTPUT) return
  appendFileSync(GITHUB_OUTPUT, `${key}=${value}\n`)
}
