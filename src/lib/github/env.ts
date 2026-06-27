export type GithubRepoEnv = {
  owner: string
  repo: string
  branch: string
  token: string
}

export function getImageGithubEnv(): GithubRepoEnv {
  const owner = process.env.IMAGE_GITHUB_OWNER
  const repo = process.env.IMAGE_GITHUB_REPO
  const branch = process.env.IMAGE_GITHUB_BRANCH || 'main'
  const token = process.env.IMAGE_GITHUB_TOKEN

  if (!owner || !repo || !token) {
    throw new Error('Missing required env vars: IMAGE_GITHUB_OWNER, IMAGE_GITHUB_REPO, IMAGE_GITHUB_TOKEN')
  }

  return { owner, repo, branch, token }
}
