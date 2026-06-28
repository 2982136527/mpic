import { after } from 'next/server'
import { updateCrawlContinuation, runCrawl } from '@/lib/services/crawl-service'

const CONTINUATION_WINDOW_MS = 180_000
const MIN_TIME_FOR_NEXT_BATCH_MS = 70_000

type ScheduleNextCrawlOptions = {
  force?: boolean
  logPrefix: string
}

export function scheduleNextCrawl({ force = false, logPrefix }: ScheduleNextCrawlOptions) {
  after(async () => {
    const scheduledAt = new Date().toISOString()
    const deadline = Date.now() + CONTINUATION_WINDOW_MS
    let continuationRuns = 0
    let lastDetail = `Queued in-process continuation window=${Math.round(CONTINUATION_WINDOW_MS / 1000)}s`

    await updateCrawlContinuation({
      lastScheduledAt: scheduledAt,
      lastStatus: 'scheduled',
      lastDetail,
      lastUrl: 'in-process',
    }).catch(() => {})

    while (Date.now() < deadline - MIN_TIME_FOR_NEXT_BATCH_MS) {
      const attemptAt = new Date().toISOString()

      await updateCrawlContinuation({
        lastAttemptAt: attemptAt,
        lastStatus: 'scheduled',
        lastDetail: `Starting in-process continuation batch ${continuationRuns + 1}`,
        lastUrl: 'in-process',
      }).catch(() => {})

      try {
        const result = await runCrawl(force)

        continuationRuns += 1
        lastDetail = `in-process batch ${continuationRuns} fetched=${result.fetched} duplicates=${result.duplicates} errors=${result.errors}`

        await updateCrawlContinuation({
          lastAttemptAt: attemptAt,
          lastAcceptedAt: new Date().toISOString(),
          lastStatus: 'accepted',
          lastDetail,
          lastUrl: 'in-process',
        }).catch(() => {})

        if (!result.shouldContinue) {
          lastDetail = `${lastDetail} stop=disabled_or_idle`
          await updateCrawlContinuation({
            lastStatus: 'accepted',
            lastDetail,
            lastUrl: 'in-process',
          }).catch(() => {})
          return
        }
      } catch (error) {
        lastDetail = error instanceof Error ? error.message : String(error)
        await updateCrawlContinuation({
          lastAttemptAt: attemptAt,
          lastStatus: 'failed',
          lastDetail: `in-process continuation failed: ${lastDetail}`,
          lastUrl: 'in-process',
        }).catch(() => {})

        console.error(logPrefix, lastDetail)
        return
      }
    }

    lastDetail = continuationRuns > 0
      ? `in-process continuation finished batches=${continuationRuns} reason=time_budget_reached`
      : 'in-process continuation skipped reason=insufficient_time_budget'

    await updateCrawlContinuation({
      lastStatus: 'accepted',
      lastDetail,
      lastUrl: 'in-process',
      ...(continuationRuns > 0 ? { lastAcceptedAt: new Date().toISOString() } : {}),
    }).catch(() => {})
  })
}
