import { getImageGithubEnv, type GithubRepoEnv } from '@/lib/github/env'
import { HttpError } from '@/lib/api/errors'

const API_BASE = 'https://api.github.com'

type RequestOptions = {
  method?: string
  body?: Record<string, unknown>
  allowStatuses?: number[]
}

function encodeSegments(input: string): string {
  return input
    .split('/')
    .filter(Boolean)
    .map(encodeURIComponent)
    .join('/')
}

async function githubRequest<T>(endpoint: string, options: RequestOptions = {}): Promise<{ data: T; status: number }> {
  const env = getImageGithubEnv()
  const url = `${API_BASE}/repos/${encodeURIComponent(env.owner)}/${encodeURIComponent(env.repo)}${endpoint}`

  const response = await fetch(url, {
    method: options.method || 'GET',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${env.token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    cache: 'no-store',
  })

  const allowed = options.allowStatuses || []
  const text = await response.text()
  const parsed = text ? (JSON.parse(text) as Record<string, unknown>) : {}

  if (!response.ok && !allowed.includes(response.status)) {
    const message = typeof parsed.message === 'string' ? parsed.message : `GitHub API error (${response.status})`
    throw new HttpError(response.status, 'GITHUB_API_ERROR', message)
  }

  return { data: parsed as T, status: response.status }
}

export function encodeBufferBase64(buffer: Buffer): string {
  return buffer.toString('base64')
}

export function encodeTextBase64(content: string): string {
  return Buffer.from(content, 'utf8').toString('base64')
}

export async function getFile(path: string): Promise<{ sha: string; content: string } | null> {
  const env = getImageGithubEnv()
  const endpoint = `/contents/${encodeSegments(path)}?ref=${encodeURIComponent(env.branch)}`
  const { data, status } = await githubRequest<{
    type?: string
    sha?: string
    content?: string
    encoding?: string
  }>(endpoint, { allowStatuses: [404] })

  if (status === 404 || !data.sha) {
    return null
  }

  const raw = (data.content || '').replace(/\n/g, '')
  const content = Buffer.from(raw, 'base64').toString('utf8')
  return { sha: data.sha, content }
}

export async function getJsonFile<T>(path: string): Promise<{ sha: string; data: T } | null> {
  const result = await getFile(path)
  if (!result) return null
  return { sha: result.sha, data: JSON.parse(result.content) as T }
}

export async function upsertFile(params: {
  path: string
  contentBase64: string
  message: string
  sha?: string
}): Promise<void> {
  const env = getImageGithubEnv()
  await githubRequest(`/contents/${encodeSegments(params.path)}`, {
    method: 'PUT',
    body: {
      message: params.message,
      content: params.contentBase64,
      branch: env.branch,
      ...(params.sha ? { sha: params.sha } : {}),
    },
  })
}

export async function deleteFile(params: {
  path: string
  sha: string
  message: string
}): Promise<void> {
  const env = getImageGithubEnv()
  await githubRequest(`/contents/${encodeSegments(params.path)}`, {
    method: 'DELETE',
    body: {
      message: params.message,
      branch: env.branch,
      sha: params.sha,
    },
  })
}

export async function uploadBinary(path: string, buffer: Buffer, message: string): Promise<void> {
  await upsertFile({
    path,
    contentBase64: encodeBufferBase64(buffer),
    message,
  })
}

export async function updateJsonWithRetry<T>(
  path: string,
  updater: (current: T) => T,
  maxRetries = 3,
): Promise<void> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const file = await getJsonFile<T>(path)
    const currentData = file ? file.data : undefined
    const sha = file?.sha

    const newData = updater(currentData as T)

    try {
      await upsertFile({
        path,
        contentBase64: encodeTextBase64(JSON.stringify(newData, null, 2)),
        message: `Update ${path}`,
        sha,
      })
      return
    } catch (error) {
      if (error instanceof HttpError && error.status === 409 && attempt < maxRetries) {
        continue
      }
      throw error
    }
  }
  throw new HttpError(500, 'CONCURRENT_WRITE_FAILED', `Failed to update ${path} after ${maxRetries} retries`)
}
