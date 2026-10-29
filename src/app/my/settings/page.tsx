'use client'

import { useEffect, useState } from 'react'
import { Bell, Moon } from 'lucide-react'
import { useAuthStore } from '@/app/store/useAuthStore'
import MyDetailHeader from '../_components/MyDetailHeader'
import MyShell from '../_components/MyShell'

// TODO: 푸시 알림과 앱 안 테마 저장이 없습니다.
// 테마는 기기 prefers-color-scheme 값만 보여 주고, 바꾸거나 저장하지 않습니다.

export default function SettingsPage() {
  const { user } = useAuthStore()
  const [scheme, setScheme] = useState<'light' | 'dark' | null>(null)

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = () => setScheme(media.matches ? 'dark' : 'light')

    apply()
    media.addEventListener('change', apply)
    return () => media.removeEventListener('change', apply)
  }, [])

  if (!user) return null

  const themeLabel =
    scheme === null ? '확인 중' : scheme === 'dark' ? '다크' : '라이트'

  return (
    <MyShell className="gap-3">
      <MyDetailHeader title="알림 · 테마" />

      <section className="border-border bg-card divide-border divide-y overflow-hidden rounded-[18px] border">
        <div className="flex items-center gap-3 px-3.5 py-3.5">
          <span className="bg-accent/10 text-accent flex size-10 shrink-0 items-center justify-center rounded-xl">
            <Bell size={18} strokeWidth={2.25} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-extrabold">푸시 알림</span>
            <span className="text-muted mt-0.5 block text-[11px] font-medium">
              지출 알림은 아직 연결되지 않았어요.
            </span>
          </span>
          <span
            aria-disabled="true"
            className="bg-border relative inline-flex h-6 w-11 shrink-0 items-center rounded-full opacity-60"
          >
            <span className="bg-card ml-0.5 inline-block size-5 rounded-full shadow" />
          </span>
        </div>

        <div className="flex items-center gap-3 px-3.5 py-3.5">
          <span className="bg-accent/10 text-accent flex size-10 shrink-0 items-center justify-center rounded-xl">
            <Moon size={18} strokeWidth={2.25} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-extrabold">테마</span>
            <span className="text-muted mt-0.5 block text-[11px] font-medium">
              기기의 라이트/다크 설정을 따라요.
            </span>
          </span>
          <span className="bg-accent/10 text-accent shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold">
            시스템 · {themeLabel}
          </span>
        </div>
      </section>
    </MyShell>
  )
}
