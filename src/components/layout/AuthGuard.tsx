'use client'

import { useAuthStore } from '@/app/store/useAuthStore'
import {
  AuthFormSkeleton,
  PageSkeleton,
} from '@/components/common/ContentSkeleton'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect } from 'react'

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthStore()
  const router = useRouter()
  const pathname = usePathname()

  const isAuthPage = pathname === '/login' || pathname === '/signup'

  useEffect(() => {
    if (loading) return

    if (!user) {
      // 1. 비로그인 유저가 보호된 페이지에 접근할 때
      if (!isAuthPage) {
        router.replace('/login')
      }
    } else {
      // 2. 이미 로그인한 유저가 로그인/회원가입 페이지에 접근할 때
      if (isAuthPage) {
        router.replace('/')
      }
    }
  }, [user, loading, router, pathname, isAuthPage])

  if (loading) {
    return isAuthPage ? <AuthFormSkeleton /> : <PageSkeleton />
  }

  // 1. 인증 페이지(로그인/가입)인 경우: 유저가 없을 때만 보여줌
  if (isAuthPage) {
    return !user ? <>{children}</> : null
  }

  // 2. 일반 페이지인 경우: 유저가 있을 때만 보여줌
  return user ? <>{children}</> : null
}
