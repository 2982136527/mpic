export type GithubRepoEnv = {
  owner: string
  repo: string
  branch: string
  token: string
}

export function getImageGithubEnv(): GithubRepoEnv {
  const owner = process.env.IMAGE_GITHUB_OWNER?.trim()
  const repo = process.env.IMAGE_GITHUB_REPO?.trim()
  const branch = process.env.IMAGE_GITHUB_BRANCH?.trim() || 'main'
  const token = process.env.IMAGE_GITHUB_TOKEN?.trim()

  if (!owner || !repo || !token) {
    throw new Error('Missing required env vars: IMAGE_GITHUB_OWNER, IMAGE_GITHUB_REPO, IMAGE_GITHUB_TOKEN')
  }

  return { owner, repo, branch, token }
}

export function getGithubEnvForRepo(repoName: string): GithubRepoEnv {
  const base = getImageGithubEnv()
  return { ...base, repo: repoName.trim() }
}

export function getDefaultRepoName(): string {
  return process.env.IMAGE_GITHUB_REPO?.trim() || ''
}
