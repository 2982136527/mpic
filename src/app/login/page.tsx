import { redirect } from 'next/navigation'
import { getAuthSession } from '@/lib/auth'
import { BlurGradientBackground } from '@/components/background/blur-gradient-background'
import { GlassCard } from '@/components/ui/glass-card'
import { LoginForm } from '@/components/auth/login-form'

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
          <LoginForm callbackUrl={callbackUrl} />
        </GlassCard>
      </div>
    </div>
  )
}
