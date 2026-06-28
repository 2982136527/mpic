import fs from 'node:fs'
import sharp from 'sharp'

const CONCURRENCY = 8

function loadEnv() {
  if (!fs.existsSync('.env.vercel')) {
    throw new Error('Missing .env.vercel. Run: vercel env pull .env.vercel --environment=production --yes')
  }

  return Object.fromEntries(
    fs.readFileSync('.env.vercel', 'utf8')
      .split('\n')
      .filter(Boolean)
      .map(line => {
        const i = line.indexOf('=')
        return [line.slice(0, i), line.slice(i + 1).replace(/^"|"$/g, '')]
      }),
  )
}

async function githubJson(env, path) {
  const url = `https://api.github.com/repos/${env.IMAGE_GITHUB_OWNER}/${env.IMAGE_GITHUB_REPO}/contents/${path}?ref=${encodeURIComponent(env.IMAGE_GITHUB_BRANCH || 'main')}`
  const res = await fetch(url, {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${env.IMAGE_GITHUB_TOKEN}`,
      'X-GitHub-Api-Version': '2022-11-28',
    },
  })
  const json = await res.json()
  if (!res.ok) {
    throw new Error(`GitHub read failed: ${res.status} ${JSON.stringify(json)}`)
  }

  return {
    sha: json.sha,
    data: JSON.parse(Buffer.from((json.content || '').replace(/\n/g, ''), 'base64').toString('utf8')),
  }
}

async function githubWriteJson(env, path, sha, data) {
  const url = `https://api.github.com/repos/${env.IMAGE_GITHUB_OWNER}/${env.IMAGE_GITHUB_REPO}/contents/${path}`
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${env.IMAGE_GITHUB_TOKEN}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: 'Backfill image dimensions',
      content: Buffer.from(JSON.stringify(data, null, 2), 'utf8').toString('base64'),
      branch: env.IMAGE_GITHUB_BRANCH || 'main',
      sha,
    }),
  })
  const json = await res.json()
  if (!res.ok) {
    throw new Error(`GitHub write failed: ${res.status} ${JSON.stringify(json)}`)
  }
}

function rawUrlFor(env, image) {
  const repo = image.repo || env.IMAGE_GITHUB_REPO
  const branch = env.IMAGE_GITHUB_BRANCH || 'main'
  return `https://raw.githubusercontent.com/${env.IMAGE_GITHUB_OWNER}/${repo}/${branch}/${image.path}`
}

async function fetchDimensions(env, image) {
  const response = await fetch(rawUrlFor(env, image), {
    headers: { 'User-Agent': 'MPic-Dimension-Backfill/1.0' },
  })
  if (!response.ok) {
    throw new Error(`image fetch ${response.status}`)
  }

  const buffer = Buffer.from(await response.arrayBuffer())
  const metadata = await sharp(buffer, { animated: true }).metadata()
  if (!metadata.width || !metadata.height) {
    throw new Error('missing metadata width/height')
  }

  return { width: metadata.width, height: metadata.height }
}

async function mapWithConcurrency(items, worker) {
  let index = 0
  const workers = Array.from({ length: Math.min(CONCURRENCY, items.length) }, async () => {
    while (index < items.length) {
      const current = items[index++]
      await worker(current)
    }
  })
  await Promise.all(workers)
}

async function main() {
  const env = loadEnv()
  const file = await githubJson(env, 'data/images.json')
  const images = file.data.images.filter(image => !image.deletedAt && (!image.width || !image.height))

  console.log(`missing dimensions: ${images.length}`)
  if (images.length === 0) return

  let fixed = 0
  let failed = 0

  await mapWithConcurrency(images, async image => {
    try {
      const dimensions = await fetchDimensions(env, image)
      image.width = dimensions.width
      image.height = dimensions.height
      fixed += 1
      if (fixed % 25 === 0) {
        console.log(`fixed ${fixed}/${images.length}`)
      }
    } catch (error) {
      failed += 1
      console.error(`failed ${image.path}: ${error instanceof Error ? error.message : String(error)}`)
    }
  })

  await githubWriteJson(env, 'data/images.json', file.sha, file.data)
  console.log(`done fixed=${fixed} failed=${failed}`)
}

await main()
