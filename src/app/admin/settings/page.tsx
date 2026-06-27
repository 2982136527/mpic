import { redirect } from 'next/navigation'
import { getAuthSession } from '@/lib/auth'
import { isAdminLogin } from '@/lib/api/permissions'
import { getSettings } from '@/lib/services/settings-service'
import { AdminSettingsPage } from '@/components/admin/admin-settings-page'

export default async function AdminSettingsPageServer() {
  const session = await getAuthSession()

  if (!session?.user?.login) {
    redirect('/login?callbackUrl=/admin/settings')
  }

  if (!isAdminLogin(session.user.login)) {
    return <div className='rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700'>无管理员权限。</div>
  }

  const settings = await getSettings()

  return <AdminSettingsPage settings={settings} />
}
