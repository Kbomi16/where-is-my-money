'use client'

import { CircleHelp, Megaphone, MessageCircle } from 'lucide-react'
import { useAuthStore } from '@/app/store/useAuthStore'
import { HubAction, HubRow } from '../_components/HubRow'
import MyDetailHeader from '../_components/MyDetailHeader'
import MyShell from '../_components/MyShell'

const KAKAO_CHAT_URL = 'https://open.kakao.com/o/slgNaJhi'

// TODO: FAQ 데이터 소스가 없습니다. 공지와 문의만 기존 화면으로 연결합니다.

export default function HelpPage() {
  const { user } = useAuthStore()

  if (!user) return null

  return (
    <MyShell className="gap-3">
      <MyDetailHeader title="공지 · 도움말" />

      <section className="border-border bg-card divide-border divide-y overflow-hidden rounded-[18px] border">
        <HubRow
          href="/notice"
          icon={Megaphone}
          tone="rose"
          title="공지사항"
          description="업데이트와 안내"
        />
        <HubAction
          icon={MessageCircle}
          tone="blue"
          title="문의하기"
          description="개발자 오픈채팅"
          onClick={() => window.open(KAKAO_CHAT_URL)}
        />
      </section>

      <section className="border-border bg-card rounded-[18px] border px-4 py-4">
        <div className="flex items-center gap-3">
          <span className="bg-accent/10 text-accent flex size-10 items-center justify-center rounded-xl">
            <CircleHelp size={18} strokeWidth={2.25} />
          </span>
          <div>
            <h2 className="text-sm font-extrabold">FAQ</h2>
            <p className="text-muted mt-0.5 text-[11px] font-medium">
              자주 묻는 질문은 아직 준비 중이에요.
            </p>
          </div>
        </div>
      </section>
    </MyShell>
  )
}
