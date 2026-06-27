import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getAuthSession } from '@/lib/auth'
import { BlurGradientBackground } from '@/components/background/blur-gradient-background'
import { GlassCard } from '@/components/ui/glass-card'
import { GitHubSignInButton } from '@/components/auth/github-signin-button'

type LoginPageProps = {
  searchParams: Promise<{ callbackUrl?: string }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams
  const callbackUrl = params.callbackUrl || '/dashboard'
  const session = await getAuthSession()

  if (session?.user?.login) {
    redirect(callbackUrl)
  }

  return (
    <div className='relative min-h-screen' data-theme-scope='public'>
      <BlurGradientBackground />

      <div className='mx-auto flex min-h-screen max-w-xl items-center justify-center px-5'>
        <GlassCard className='w-full'>
          <h2 className='font-title text-4xl text-[var(--color-ink)]'>登录 Mpic</h2>
          <p className='mt-3 text-sm leading-6 text-[var(--color-ink-soft)]'>
            使用 GitHub 账号登录后即可上传和管理图片。
          </p>

          <div className='mt-6 flex flex-wrap gap-3'>
            <GitHubSignInButton callbackUrl={callbackUrl} />
            <Link
              href='/'
              className='rounded-xl border border-[var(--color-border-strong)] bg-white px-5 py-2 text-sm text-[var(--color-ink-soft)] transition hover:text-[var(--color-ink)]'>
              返回首页
            </Link>
          </div>
        </GlassCard>
      </div>
    </div>
  )
}
