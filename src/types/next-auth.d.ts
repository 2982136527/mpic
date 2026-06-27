import type { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user?: DefaultSession['user'] & {
      login?: string
      role?: 'user' | 'admin'
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    login?: string
    githubAccessToken?: string
  }
}
