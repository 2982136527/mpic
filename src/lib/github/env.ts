export type GithubRepoEnv = {
  owner: string
  repo: string
  branch: string
  token: string
}

export function getImageGithubEnv(): GithubRepoEnv {
  const owner = normalizeEnvValue(process.env.IMAGE_GITHUB_OWNER)
  const repo = normalizeEnvValue(process.env.IMAGE_GITHUB_REPO)
  const branch = normalizeEnvValue(process.env.IMAGE_GITHUB_BRANCH) || 'main'
  const token = normalizeEnvValue(process.env.IMAGE_GITHUB_TOKEN)

  if (!owner || !repo || !token) {
    throw new Error('Missing required env vars: IMAGE_GITHUB_OWNER, IMAGE_GITHUB_REPO, IMAGE_GITHUB_TOKEN')
  }

  return { owner, repo, branch, token }
}

export function getGithubEnvForRepo(repoName: string): GithubRepoEnv {
  const base = getImageGithubEnv()
  return { ...base, repo: normalizeEnvValue(repoName) || base.repo }
}

export function getDefaultRepoName(): string {
  return normalizeEnvValue(process.env.IMAGE_GITHUB_REPO) || ''
}

function normalizeEnvValue(value: string | undefined): string | undefined {
  if (typeof value !== 'string') return undefined
  const normalized = value.replace(/\\n/g, '').trim()
  return normalized || undefined
}
