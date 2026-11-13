'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  describeSocialSignInError,
  finishSocialSignIn,
  signInWithGoogle,
} from '@/lib/auth/socialSignIn'

type Provider = 'google' | 'kakao'

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"
      />
    </svg>
  )
}

function KakaoIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 3C6.48 3 2 6.48 2 10.77c0 2.77 1.86 5.2 4.66 6.57-.2.75-.74 2.72-.85 3.14-.13.52.19.51.4.37.17-.11 2.62-1.78 3.68-2.5.69.1 1.39.15 2.11.15 5.52 0 10-3.48 10-7.73S17.52 3 12 3z"
      />
    </svg>
  )
}

/**
 * 구글·카카오 버튼. 버튼 하나로 처음이면 자동 가입, 이미 있으면 로그인.
 */
export default function SocialLoginButtons({
  disabled = false,
  onPendingLink,
}: {
  disabled?: boolean
  /** 계정 충돌로 연결 대기 상태가 되면 호출 (로그인 화면에서 이메일 칸 채우기용) */
  onPendingLink?: () => void
}) {
  const [busy, setBusy] = useState<Provider | null>(null)
  const router = useRouter()

  const handleGoogle = async () => {
    setBusy('google')
    try {
      const result = await signInWithGoogle()
      if (result.status === 'redirecting') return // 페이지가 이동함

      const { isNewUser, nickname } = await finishSocialSignIn(
        result.credential,
        { fallbackNickname: '구글 사용자' },
      )
      toast.success(
        isNewUser ? `${nickname}님, 환영해요!` : '로그인 성공! 기록을 시작해보세요.',
        isNewUser ? { description: '구글 계정으로 가입되었어요.' } : undefined,
      )
      router.replace('/')
    } catch (error) {
      const message = await describeSocialSignInError(error)
      if (message) {
        toast.error(message, { duration: 8000 })
        onPendingLink?.()
      }
      setBusy(null)
    }
  }

  const handleKakao = () => {
    setBusy('kakao')
    window.location.assign('/api/auth/kakao/start?next=%2F')
  }

  const isDisabled = disabled || busy !== null

  return (
    <div className="w-full space-y-3">
      <div className="text-muted flex items-center gap-3 text-xs">
        <span className="bg-border/60 h-px flex-1" />
        또는 간편하게
        <span className="bg-border/60 h-px flex-1" />
      </div>

      <Button
        type="button"
        variant="outline"
        className="h-12 w-full rounded-xl bg-white text-base font-bold text-slate-800 hover:bg-slate-50 hover:text-slate-900 dark:bg-white dark:text-slate-800"
        disabled={isDisabled}
        onClick={handleGoogle}
        aria-busy={busy === 'google'}
      >
        {busy === 'google' ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <GoogleIcon />
        )}
        {busy === 'google' ? '구글 연결 중...' : '구글로 계속하기'}
      </Button>

      <Button
        type="button"
        className="h-12 w-full rounded-xl bg-[#FEE500] text-base font-bold text-black/85 shadow-none hover:bg-[#FEE500]/90 hover:shadow-none"
        disabled={isDisabled}
        onClick={handleKakao}
        aria-busy={busy === 'kakao'}
      >
        {busy === 'kakao' ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <KakaoIcon />
        )}
        {busy === 'kakao' ? '카카오로 이동 중...' : '카카오로 계속하기'}
      </Button>
    </div>
  )
}
