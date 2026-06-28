import { getCrawlConfig, runCrawl, updateCrawlContinuation } from '@/lib/services/crawl-service'

const CONTINUATION_WINDOW_MS = 270_000
const MIN_TIME_FOR_NEXT_BATCH_MS = 60_000
const BETWEEN_BATCHES_MS = 1_500

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
    lastDetail: `GitHub Actions run started enabled=${config.enabled} enabledSources=${enabledSources} force=${force} windowMs=${CONTINUATION_WINDOW_MS}`,
    ...(runUrl ? { lastUrl: runUrl } : {}),
  })

  try {
    const deadline = Date.now() + CONTINUATION_WINDOW_MS
    let batches = 0
    let fetched = 0
    let duplicates = 0
    let errors = 0
    let stopReason = 'time_budget_reached'

    while (Date.now() < deadline) {
      const latestConfig = await getCrawlConfig()
      const latestEnabledSources = latestConfig.sources.filter(source => source.enabled).length

      if (!force && !latestConfig.enabled) {
        stopReason = 'disabled'
        break
      }

      if (latestEnabledSources === 0) {
        stopReason = 'no_enabled_sources'
        break
      }

      const runningSince = latestConfig.runningSince ? new Date(latestConfig.runningSince).getTime() : null
      if (latestConfig.running && runningSince && Date.now() - runningSince < 10 * 60 * 1000) {
        stopReason = 'already_running'
        await updateMonitor({
          lastAttemptAt: new Date().toISOString(),
          lastStatus: 'scheduled',
          lastDetail: `GitHub Actions waiting for another crawl run to finish before batch ${batches + 1}`,
          ...(runUrl ? { lastUrl: runUrl } : {}),
        })
        await wait(Math.min(5_000, Math.max(0, deadline - Date.now())))
        continue
      }

      await updateMonitor({
        lastAttemptAt: new Date().toISOString(),
        lastStatus: 'scheduled',
        lastDetail: `GitHub Actions running batch ${batches + 1} enabledSources=${latestEnabledSources} elapsedMs=${Date.now() - (new Date(startedAt).getTime())}`,
        ...(runUrl ? { lastUrl: runUrl } : {}),
      })

      const result = await runCrawl(force)
      batches += 1
      fetched += result.fetched
      duplicates += result.duplicates
      errors += result.errors

      console.log(
        `[crawl] batch=${batches} fetched=${result.fetched} duplicates=${result.duplicates} errors=${result.errors} shouldContinue=${result.shouldContinue}`,
      )

      if (!result.shouldContinue) {
        stopReason = 'disabled_or_idle'
        break
      }

      if (Date.now() >= deadline - MIN_TIME_FOR_NEXT_BATCH_MS) {
        stopReason = 'time_budget_reached'
        break
      }

      await wait(BETWEEN_BATCHES_MS)
    }

    await updateMonitor({
      lastAcceptedAt: new Date().toISOString(),
      lastStatus: 'accepted',
      lastDetail: `GitHub Actions run finished batches=${batches} fetched=${fetched} duplicates=${duplicates} errors=${errors} reason=${stopReason}`,
      ...(runUrl ? { lastUrl: runUrl } : {}),
    })

    console.log(
      `[crawl] result batches=${batches} fetched=${fetched} duplicates=${duplicates} errors=${errors} reason=${stopReason}`,
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

function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
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
