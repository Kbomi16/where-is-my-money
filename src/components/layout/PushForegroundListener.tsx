'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/app/store/useAuthStore'

const PUSH_ENABLED_EVENT = 'wimm:push-enabled' // pushClient.ts PUSH_ENABLED_EVENT 와 같은 값

/**
 * 로그인 + 알림 권한이 있을 때만 포그라운드 푸시 수신을 붙인다.
 * firebase/messaging 은 여기서 동적 import 해 첫 화면 번들에 넣지 않는다.
 */
export default function PushForegroundListener() {
  const { user } = useAuthStore()
  const [enabledTick, setEnabledTick] = useState(0)

  useEffect(() => {
    const onEnabled = () => setEnabledTick((value) => value + 1)
    window.addEventListener(PUSH_ENABLED_EVENT, onEnabled)
    return () => window.removeEventListener(PUSH_ENABLED_EVENT, onEnabled)
  }, [])

  useEffect(() => {
    if (!user) return
    if (!('Notification' in window) || Notification.permission !== 'granted') return

    let cancelled = false
    let unsubscribe: (() => void) | null = null
    import('@/lib/push/pushClient')
      .then(({ listenForegroundMessages }) => listenForegroundMessages())
      .then((stop) => {
        if (cancelled) stop()
        else unsubscribe = stop
      })
      .catch((error) => console.warn('[push] 포그라운드 수신 준비 실패', error))

    return () => {
      cancelled = true
      unsubscribe?.()
    }
  }, [user, enabledTick])

  return null
}
