'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { signInWithCustomToken } from 'firebase/auth'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { auth } from '@/lib/firebase'
import { parseCompleteFragment } from '@/lib/auth/kakaoOAuth'
import {
  SOCIAL_ERROR_PARAM,
  mapSocialAuthError,
} from '@/lib/auth/socialAuthCore'
import { errorCode, finishSocialSignIn } from '@/lib/auth/socialSignIn'

// 3단계: 서버가 발급한 custom token으로 Firebase 로그인 (URL fragment로 받아 즉시 지움)
export default function KakaoCompletePage() {
  const router = useRouter()
  const startedRef = useRef(false)

  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true

    const parsed = parseCompleteFragment(window.location.hash)
    window.history.replaceState(null, '', window.location.pathname)

    if (!parsed) {
      router.replace(`/login?${SOCIAL_ERROR_PARAM}=kakao_token_missing`)
      return
    }

    signInWithCustomToken(auth, parsed.token)
      .then(async (credential) => {
        const { isNewUser, nickname } = await finishSocialSignIn(credential, {
          nickname: parsed.nickname,
          email: parsed.email,
          fallbackNickname: '카카오 사용자',
        })
        toast.success(
          isNewUser
            ? `${nickname}님, 환영해요!`
            : '로그인 성공! 기록을 시작해보세요.',
          isNewUser
            ? { description: '카카오 계정으로 가입되었어요.' }
            : undefined,
        )
        router.replace(parsed.next)
      })
      .catch((error) => {
        const { message } = mapSocialAuthError(errorCode(error))
        if (message) toast.error(message)
        router.replace('/login')
      })
  }, [router])

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
      <Loader2 className="text-accent h-8 w-8 animate-spin" />
      <p className="text-muted text-sm">카카오 계정으로 로그인하는 중이에요...</p>
    </div>
  )
}
