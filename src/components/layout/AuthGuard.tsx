'use client'

import { useAuthStore } from '@/app/store/useAuthStore'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect } from 'react'

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthStore()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // 로딩이 끝났는데 유저가 없고, 현재 페이지가 로그인/회원가입이 아니면 로그인으로 보냄
    if (!loading && !user && pathname !== '/login' && pathname !== '/signup') {
      router.push('/login')
    }
  }, [user, loading, router, pathname])

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center">
        기다려주세요...
      </div>
    )

  // 로그인/회원가입 페이지는 가드 없이 보여주고, 그 외는 유저가 있을 때만 보여줌
  if (!user && (pathname === '/login' || pathname === '/signup')) {
    return <>{children}</>
  }

  return user ? <>{children}</> : null
}
