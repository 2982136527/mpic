import type { NextAuthOptions } from 'next-auth'
import { getServerSession } from 'next-auth'
import GitHubProvider from 'next-auth/providers/github'
import { isAdminLogin } from '@/lib/api/permissions'

export const authOptions: NextAuthOptions = {
  secret: process.env.AUTH_SECRET,
  session: {
    strategy: 'jwt',
  },
  providers: [
    GitHubProvider({
      clientId: process.env.AUTH_GITHUB_ID || '',
      clientSecret: process.env.AUTH_GITHUB_SECRET || '',
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
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      cache: 'no-store',
    })

    if (!response.ok) return undefined

    const profile = await response.json()
    return typeof profile?.login === 'string' ? profile.login : undefined
  } catch {
    return undefined
  }
}
