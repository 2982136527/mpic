import type { NextAuthOptions, Profile, TokenSet } from 'next-auth'
import { getServerSession } from 'next-auth'
import GitHubProvider from 'next-auth/providers/github'
import type { GithubEmail, GithubProfile } from 'next-auth/providers/github'
import { isAdminLogin } from '@/lib/api/permissions'

export const authOptions: NextAuthOptions = {
  secret: process.env.AUTH_SECRET,
  session: {
    strategy: 'jwt',
  },
  providers: [
    GitHubProvider<GithubProfile>({
      clientId: process.env.AUTH_GITHUB_ID || '',
      clientSecret: process.env.AUTH_GITHUB_SECRET || '',
      userinfo: {
        async request({ tokens }: { tokens: TokenSet }) {
          const accessToken = tokens.access_token
          if (!accessToken) {
            throw new Error('Missing GitHub access token')
          }

          const profileResponse = await fetch('https://api.github.com/user', {
            headers: githubApiHeaders(accessToken),
            cache: 'no-store',
          })

          if (!profileResponse.ok) {
            const detail = await profileResponse.text()
            throw new Error(`GitHub userinfo failed: ${profileResponse.status} ${detail.slice(0, 300)}`)
          }

          const profile = (await profileResponse.json()) as GithubProfile

          if (!profile.email) {
            const emailResponse = await fetch('https://api.github.com/user/emails', {
              headers: githubApiHeaders(accessToken),
              cache: 'no-store',
            })

            if (emailResponse.ok) {
              const emails = (await emailResponse.json()) as GithubEmail[]
              const primary = emails.find(email => email.primary) || emails[0]
              if (primary?.email) {
                profile.email = primary.email
              }
            }
          }

          return {
            ...profile,
            name: profile.name ?? undefined,
            email: profile.email ?? undefined,
            image: profile.avatar_url ?? undefined,
          } satisfies Profile
        },
      },
    }),
  ],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, profile, account }) {
      if (profile && 'id' in profile && (typeof profile.id === 'string' || typeof profile.id === 'number')) {
        token.githubId = String(profile.id)
      }
      if (account && typeof account.access_token === 'string') {
        token.githubAccessToken = account.access_token
        if (!token.login) {
          const githubLogin = await fetchGithubLogin(account.access_token)
          if (githubLogin) {
            token.login = githubLogin
          }
        }
      }
      if (!token.login && profile && 'login' in profile && typeof profile.login === 'string') {
        token.login = profile.login
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        const login = typeof token.login === 'string' ? token.login : undefined
        const githubId = typeof token.githubId === 'string' ? token.githubId : undefined
        session.user.login = login
        session.user.githubId = githubId
        session.user.role = isAdminLogin(login) ? 'admin' : 'user'
      }
      return session
    },
  },
}

export function getAuthSession() {
  return getServerSession(authOptions)
}

async function fetchGithubLogin(accessToken: string): Promise<string | undefined> {
  try {
    const response = await fetch('https://api.github.com/user', {
      headers: githubApiHeaders(accessToken),
      cache: 'no-store',
    })

    if (!response.ok) return undefined

    const profile = await response.json()
    return typeof profile?.login === 'string' ? profile.login : undefined
  } catch {
    return undefined
  }
}

function githubApiHeaders(accessToken: string) {
  return {
    Authorization: `Bearer ${accessToken}`,
    Accept: 'application/vnd.github+json',
    'User-Agent': 'MPic',
    'X-GitHub-Api-Version': '2022-11-28',
  }
}
