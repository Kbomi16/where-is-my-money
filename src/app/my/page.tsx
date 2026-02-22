'use client'

import { useAuthStore } from '@/app/store/useAuthStore'
import { Button } from '@/components/ui/button'
import { auth } from '@/lib/firebase'
import { signOut } from 'firebase/auth'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { LogOut, Settings2, User } from 'lucide-react'
import AccountSection from './_components/AccountSection'
import ProfileSection from './_components/ProfileSection'

export default function MyPage() {
  const { user } = useAuthStore()
  const router = useRouter()

  console.log(user)

  const handleLogout = async () => {
    try {
      await signOut(auth)
      toast.success('로그아웃 되었습니다...')
      router.push('/login')
    } catch (error) {
      toast.error('로그아웃 중 오류가 발생했습니다.')
    }
  }

  if (!user) return null

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 base-layout min-h-[calc(100vh-64px)] py-6 duration-500 lg:py-12">
      <div className="mx-auto pb-10">
        <div className="flex flex-col items-start text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
            <User size={28} className="text-accent" />
          </div>
        </div>
        <h1 className="text-3xl font-black tracking-tight text-slate-900 md:text-4xl dark:text-slate-50">
          마이페이지
        </h1>
        <p className="mt-3 text-slate-500 dark:text-slate-400">
          {user?.displayName}님의 정보를 확인하고 관리해보세요.
        </p>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3 lg:gap-8">
        {/* 왼쪽 */}
        <div className="order-1 lg:col-span-2">
          <ProfileSection user={user} />
        </div>

        {/* 오른쪽 */}
        <div className="order-2 flex flex-col gap-6">
          <AccountSection user={user} />

          <Button
            variant="ghost"
            className="h-14 w-full rounded-2xl border border-rose-100 bg-rose-50/30 font-bold text-rose-500 transition-all hover:bg-rose-50 hover:text-rose-600 dark:border-rose-900/30 dark:bg-rose-900/10"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-5 w-5" />
            로그아웃
          </Button>
        </div>
      </div>
    </div>
  )
}
