'use client'

import { useAuthStore } from '@/app/store/useAuthStore'
import AccountSection from '../_components/AccountSection'
import MyDetailHeader from '../_components/MyDetailHeader'
import MyShell from '../_components/MyShell'
import ProfileSection from '../_components/ProfileSection'

export default function ProfilePage() {
  const { user } = useAuthStore()

  if (!user) return null

  return (
    <MyShell className="gap-6">
      <MyDetailHeader
        title="프로필"
        description="닉네임과 계정을 여기서 바꿔요"
      />
      <ProfileSection user={user} />
      <AccountSection user={user} />
    </MyShell>
  )
}
