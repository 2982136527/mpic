import { getCrawlConfig, runCrawl } from '@/lib/services/crawl-service'

async function main() {
  const force = process.argv.includes('--force')
  const configOnly = process.argv.includes('--config-only')
  const config = await getCrawlConfig()
  const enabledSources = config.sources.filter(source => source.enabled).length

  console.log(
    `[crawl] config enabled=${config.enabled} running=${Boolean(config.running)} enabledSources=${enabledSources} force=${force} configOnly=${configOnly}`,
  )

  if (configOnly) return

  const result = await runCrawl(force)

  console.log(
    `[crawl] result fetched=${result.fetched} duplicates=${result.duplicates} errors=${result.errors} shouldContinue=${result.shouldContinue}`,
  )
}

main().catch(error => {
  console.error('[crawl] failed', error)
  process.exitCode = 1
})
