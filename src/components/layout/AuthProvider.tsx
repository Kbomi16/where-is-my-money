'use client'

import { useEffect } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { toast } from 'sonner'
import { auth } from '@/lib/firebase'
import { useAuthStore } from '@/app/store/useAuthStore'
import {
  completeGoogleRedirect,
  describeSocialSignInError,
  finishSocialSignIn,
} from '@/lib/auth/socialSignIn'

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const { setUser, setLoading } = useAuthStore()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [setUser, setLoading])

  // 구글 redirect 폴백으로 돌아온 경우 결과 처리 (로그인 화면은 이미 사라졌을 수 있어 여기서 처리)
  useEffect(() => {
    completeGoogleRedirect()
      .then(async (credential) => {
        if (!credential) return
        const { isNewUser, nickname } = await finishSocialSignIn(credential, {
          fallbackNickname: '구글 사용자',
        })
        toast.success(
          isNewUser
            ? `${nickname}님, 환영해요!`
            : '로그인 성공! 기록을 시작해보세요.',
        )
      })
      .catch(async (error) => {
        const message = await describeSocialSignInError(error)
        if (message) toast.error(message, { duration: 8000 })
      })
  }, [])

  return <>{children}</>
}
