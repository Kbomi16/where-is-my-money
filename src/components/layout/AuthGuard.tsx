'use client'

import { useAuthStore } from '@/app/store/useAuthStore'
import { Button } from '@/components/ui/button'
import { auth } from '@/lib/firebase'
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { LogIn, Wallet } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthStore()

  const router = useRouter()

  const handleLogin = () => {
    router.push('/login')
  }

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center">
        로딩 중...
      </div>
    )

  // 로그인 안 되었을 때
  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <Wallet className="text-accent mb-4 h-12 w-12" />
        <h1 className="mb-6 text-2xl font-bold">로그인이 필요해요</h1>
        <Button
          variant="outline"
          onClick={handleLogin}
          className="flex items-center gap-2"
        >
          로그인
        </Button>
      </div>
    )
  }

  // 로그인 되었을 때만 children(메인 페이지 등)을 렌더링
  return <>{children}</>
}
