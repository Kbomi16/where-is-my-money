'use client'

import { useCallback, useEffect, useState } from 'react'
import type { User } from 'firebase/auth'
import { toast } from 'sonner'
import type { PushSupport } from '@/lib/push/pushCore'
import {
  detectPushSupport,
  disablePush,
  enablePush,
  readSavedPushToken,
} from '@/lib/push/pushClient'

const ON_TEXT = '아침 9시·점심 1시·저녁 7시에 기록이 없으면 이 기기로 알려드려요.'
const OFF_TEXT = '켜면 하루 세 번(9시·13시·19시) 기록을 잊지 않게 알려드려요.'
const DENIED_TEXT = '알림이 차단돼 있어요. 브라우저 사이트 설정에서 알림을 허용해 주세요.'

/** 설정 화면 푸시 알림 토글 상태. 켜짐 = 권한 허용 + 이 기기 토큰이 서버에 저장됨 */
export function usePushNotification(user: User | null) {
  const [support, setSupport] = useState<PushSupport | null>(null)
  const [enabled, setEnabled] = useState(false)
  const [denied, setDenied] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let cancelled = false
    detectPushSupport().then((result) => {
      if (cancelled) return
      setSupport(result)
      if (!result.ok || !user) return
      const permission = Notification.permission
      setDenied(permission === 'denied')
      setEnabled(permission === 'granted' && !!readSavedPushToken(user.uid))
    })
    return () => {
      cancelled = true
    }
  }, [user])

  const toggle = useCallback(
    async (next: boolean) => {
      if (!user || busy) return
      setBusy(true)
      try {
        if (next) {
          const result = await enablePush(user)
          if (result.ok) {
            setEnabled(true)
            setDenied(false)
            toast.success('푸시 알림을 켰어요.')
          } else {
            setEnabled(false)
            setDenied(result.reason === 'denied')
            toast.error(result.message)
          }
        } else {
          await disablePush(user)
          setEnabled(false)
          toast.success('푸시 알림을 껐어요.')
        }
      } finally {
        setBusy(false)
      }
    },
    [user, busy],
  )

  const description =
    support === null
      ? '확인 중이에요.'
      : !support.ok
        ? support.message
        : busy
          ? '설정을 바꾸는 중이에요.'
          : denied
            ? DENIED_TEXT
            : enabled
              ? ON_TEXT
              : OFF_TEXT

  return {
    enabled,
    description,
    canToggle: !!user && !!support?.ok && !busy && (!denied || enabled),
    toggle,
  }
}
