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
      if (profile && 'login' in profile && typeof profile.login === 'string') {
        token.login = profile.login
      }
      if (account && typeof account.access_token === 'string') {
        token.githubAccessToken = account.access_token
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        const login = typeof token.login === 'string' ? token.login : undefined
        session.user.login = login
        session.user.role = isAdminLogin(login) ? 'admin' : 'user'
      }
      return session
    },
  },
}

export function getAuthSession() {
  return getServerSession(authOptions)
}
