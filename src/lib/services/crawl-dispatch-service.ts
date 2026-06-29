import { HttpError } from '@/lib/api/errors'
import { getCrawlConfig, updateCrawlContinuation } from '@/lib/services/crawl-service'

const CRAWL_WORKFLOW_FILE = 'crawl.yml'
const DEFAULT_REPO_SLUG = 'mpic'
const DEFAULT_REF = 'main'
const WAKE_COOLDOWN_MS = 60_000

type WakeCrawlWorkflowResult = {
  dispatched: boolean
  skippedReason?: 'already_running' | 'recently_scheduled'
  workflowUrl: string
}

export async function wakeCrawlWorkflow(reason: string): Promise<WakeCrawlWorkflowResult> {
  const repo = getWorkflowRepo()
  const workflowUrl = `https://github.com/${repo.owner}/${repo.name}/actions/workflows/${CRAWL_WORKFLOW_FILE}`
  const config = await getCrawlConfig()
  const now = Date.now()

  if (config.running) {
    return { dispatched: false, skippedReason: 'already_running', workflowUrl }
  }

  const lastScheduledAt = config.continuation?.lastScheduledAt
  if (lastScheduledAt) {
    const scheduledAtMs = new Date(lastScheduledAt).getTime()
    if (!Number.isNaN(scheduledAtMs) && now - scheduledAtMs < WAKE_COOLDOWN_MS) {
      return { dispatched: false, skippedReason: 'recently_scheduled', workflowUrl }
    }
  }

  const scheduledAt = new Date(now).toISOString()
  await updateCrawlContinuation({
    lastScheduledAt: scheduledAt,
    lastStatus: 'scheduled',
    lastDetail: `Dispatching GitHub Actions wake reason=${reason}`,
    lastUrl: workflowUrl,
  }).catch(() => {})

  const response = await fetch(
    `https://api.github.com/repos/${encodeURIComponent(repo.owner)}/${encodeURIComponent(repo.name)}/actions/workflows/${CRAWL_WORKFLOW_FILE}/dispatches`,
    {
      method: 'POST',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${repo.token}`,
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ref: repo.ref }),
      cache: 'no-store',
    },
  )

  if (!response.ok) {
    const detail = (await response.text()).slice(0, 500)
    await updateCrawlContinuation({
      lastStatus: 'failed',
      lastDetail: `Failed to dispatch GitHub Actions wake status=${response.status} reason=${reason} detail=${detail || 'empty'}`,
      lastUrl: workflowUrl,
    }).catch(() => {})

    throw new HttpError(502, 'CRAWL_WAKE_FAILED', 'Failed to wake auto crawl workflow')
  }

  return { dispatched: true, workflowUrl }
}

function getWorkflowRepo() {
  const owner = (
    normalizeEnvValue(process.env.VERCEL_GIT_REPO_OWNER)
    || normalizeEnvValue(process.env.GITHUB_REPOSITORY_OWNER)
    || normalizeEnvValue(process.env.IMAGE_GITHUB_OWNER)
  )
  const name = (
    normalizeEnvValue(process.env.VERCEL_GIT_REPO_SLUG)
    || normalizeEnvValue(process.env.GITHUB_REPOSITORY?.split('/')[1])
    || DEFAULT_REPO_SLUG
  )
  const ref = (
    normalizeEnvValue(process.env.VERCEL_GIT_COMMIT_REF)
    || normalizeEnvValue(process.env.GITHUB_REF_NAME)
    || DEFAULT_REF
  )
  const token = normalizeEnvValue(process.env.GITHUB_TOKEN) || normalizeEnvValue(process.env.IMAGE_GITHUB_TOKEN)

  if (!owner || !name || !token) {
    throw new HttpError(500, 'CRAWL_WAKE_CONFIG_MISSING', 'Missing GitHub workflow dispatch configuration')
  }

  return { owner, name, ref, token }
}

function normalizeEnvValue(value: string | undefined): string | undefined {
  if (typeof value !== 'string') return undefined
  const normalized = value.replace(/\\n/g, '').trim()
  return normalized || undefined
}
