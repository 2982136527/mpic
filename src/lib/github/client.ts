import { getImageGithubEnv, getGithubEnvForRepo, type GithubRepoEnv } from '@/lib/github/env'
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

async function githubRequestWithEnv<T>(env: GithubRepoEnv, endpoint: string, options: RequestOptions = {}): Promise<{ data: T; status: number }> {
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

async function githubRequest<T>(endpoint: string, options: RequestOptions = {}): Promise<{ data: T; status: number }> {
  const env = getImageGithubEnv()
  return githubRequestWithEnv(env, endpoint, options)
}

export function encodeBufferBase64(buffer: Buffer): string {
  return buffer.toString('base64')
}

export function encodeTextBase64(content: string): string {
  return Buffer.from(content, 'utf8').toString('base64')
}

export async function getFile(path: string, repo?: string): Promise<{ sha: string; content: string } | null> {
  const env = repo ? getGithubEnvForRepo(repo) : getImageGithubEnv()
  const endpoint = `/contents/${encodeSegments(path)}?ref=${encodeURIComponent(env.branch)}`
  const { data, status } = await githubRequestWithEnv<{
    type?: string
    sha?: string
    content?: string
    encoding?: string
  }>(env, endpoint, { allowStatuses: [404] })

  if (status === 404 || !data.sha) {
    return null
  }

  const raw = (data.content || '').replace(/\n/g, '')
  const content = Buffer.from(raw, 'base64').toString('utf8')
  return { sha: data.sha, content }
}

export async function getJsonFile<T>(path: string, repo?: string): Promise<{ sha: string; data: T } | null> {
  const result = await getFile(path, repo)
  if (!result) return null
  return { sha: result.sha, data: JSON.parse(result.content) as T }
}

export async function upsertFile(params: {
  path: string
  contentBase64: string
  message: string
  sha?: string
  repo?: string
}): Promise<void> {
  const env = params.repo ? getGithubEnvForRepo(params.repo) : getImageGithubEnv()
  await githubRequestWithEnv(env, `/contents/${encodeSegments(params.path)}`, {
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
  repo?: string
}): Promise<void> {
  const env = params.repo ? getGithubEnvForRepo(params.repo) : getImageGithubEnv()
  await githubRequestWithEnv(env, `/contents/${encodeSegments(params.path)}`, {
    method: 'DELETE',
    body: {
      message: params.message,
      branch: env.branch,
      sha: params.sha,
    },
  })
}

export async function uploadBinary(path: string, buffer: Buffer, message: string, repo?: string): Promise<void> {
  await upsertFile({
    path,
    contentBase64: encodeBufferBase64(buffer),
    message,
    repo,
  })
}

export async function updateJsonWithRetry<T>(
  path: string,
  updater: (current: T) => T,
  maxRetries = 3,
  repo?: string,
): Promise<void> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const file = await getJsonFile<T>(path, repo)
    const currentData = file ? file.data : undefined
    const sha = file?.sha

    const newData = updater(currentData as T)

    try {
      await upsertFile({
        path,
        contentBase64: encodeTextBase64(JSON.stringify(newData, null, 2)),
        message: `Update ${path}`,
        sha,
        repo,
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

// Create a new GitHub repository via API
export async function createRepo(repoName: string): Promise<void> {
  const env = getImageGithubEnv()
  await githubRequestWithEnv<{ full_name?: string }>(
    { ...env, repo: 'unused' },
    `/user/repos`,
    {
      method: 'POST',
      body: {
        name: repoName,
        private: false,
        auto_init: true,
        description: `mpic image storage shard`,
      },
    },
  )
}

// Get repo info (size in KB)
export async function getRepoSize(repoName: string): Promise<number> {
  const env = getGithubEnvForRepo(repoName)
  const { data } = await githubRequestWithEnv<{ size?: number }>(env, '')
  return (data.size || 0) * 1024 // GitHub returns size in KB
}
