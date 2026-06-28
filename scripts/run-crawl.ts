import { getCrawlConfig, runCrawl, updateCrawlContinuation } from '@/lib/services/crawl-service'

async function main() {
  const force = process.argv.includes('--force')
  const configOnly = process.argv.includes('--config-only')
  const config = await getCrawlConfig()
  const enabledSources = config.sources.filter(source => source.enabled).length
  const startedAt = new Date().toISOString()
  const runUrl = getGithubRunUrl()

  console.log(
    `[crawl] config enabled=${config.enabled} running=${Boolean(config.running)} enabledSources=${enabledSources} force=${force} configOnly=${configOnly}`,
  )

  if (configOnly) return

  await updateMonitor({
    lastScheduledAt: startedAt,
    lastAttemptAt: startedAt,
    lastStatus: 'scheduled',
    lastDetail: `GitHub Actions run started enabled=${config.enabled} enabledSources=${enabledSources} force=${force}`,
    ...(runUrl ? { lastUrl: runUrl } : {}),
  })

  try {
    const result = await runCrawl(force)

    await updateMonitor({
      lastAcceptedAt: new Date().toISOString(),
      lastStatus: 'accepted',
      lastDetail: `GitHub Actions run finished fetched=${result.fetched} duplicates=${result.duplicates} errors=${result.errors} shouldContinue=${result.shouldContinue}`,
      ...(runUrl ? { lastUrl: runUrl } : {}),
    })

    console.log(
      `[crawl] result fetched=${result.fetched} duplicates=${result.duplicates} errors=${result.errors} shouldContinue=${result.shouldContinue}`,
    )
  } catch (error) {
    await updateMonitor({
      lastStatus: 'failed',
      lastDetail: `GitHub Actions run failed: ${error instanceof Error ? error.message : String(error)}`,
      ...(runUrl ? { lastUrl: runUrl } : {}),
    })
    throw error
  }
}

main().catch(error => {
  console.error('[crawl] failed', error)
  process.exitCode = 1
})

function getGithubRunUrl(): string | undefined {
  const serverUrl = process.env.GITHUB_SERVER_URL
  const repository = process.env.GITHUB_REPOSITORY
  const runId = process.env.GITHUB_RUN_ID

  if (!serverUrl || !repository || !runId) return undefined
  return `${serverUrl}/${repository}/actions/runs/${runId}`
}

async function updateMonitor(changes: Parameters<typeof updateCrawlContinuation>[0]) {
  try {
    await updateCrawlContinuation(changes)
  } catch (error) {
    console.error('[crawl] failed to update monitor', error)
  }
}
