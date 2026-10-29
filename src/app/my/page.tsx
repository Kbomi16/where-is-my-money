'use client'

import { useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signOut } from 'firebase/auth'
import { Bell, Megaphone, Repeat, Tag, User, Wallet } from 'lucide-react'
import { toast } from 'sonner'
import { GHOST_IMAGES } from '@/app/constants/ghosts'
import { CATEGORIES } from '@/app/constants/categories'
import { useAuthStore } from '@/app/store/useAuthStore'
import { auth } from '@/lib/firebase'
import { Button } from '@/components/ui/button'
import { HubRow } from './_components/HubRow'
import MyShell from './_components/MyShell'
import {
  filterMonthExpenses,
  filterRecurring,
  sumAmount,
  useUserTransactions,
} from './_hooks/useUserTransactions'
import {
  formatCompactAmount,
  maskEmail,
  recurringSummary,
} from './_lib/myFormat'

export default function MyPage() {
  const { user } = useAuthStore()
  const router = useRouter()
  const today = useMemo(() => new Date(), [])
  const { transactions, loading } = useUserTransactions(user?.uid)

  const monthExpense = useMemo(
    () => sumAmount(filterMonthExpenses(transactions, today)),
    [transactions, today],
  )
  const recurring = useMemo(() => filterRecurring(transactions), [transactions])

  const handleLogout = async () => {
    try {
      await signOut(auth)
      toast.success('로그아웃 되었습니다...')
      router.push('/login')
    } catch (error) {
      console.error('Logout error:', error)
      toast.error('로그아웃 중 오류가 발생했습니다.')
    }
  }

  if (!user) return null

  const ghost =
    GHOST_IMAGES.find((item) => item.id === user.photoURL) ?? GHOST_IMAGES[0]
  const name = user.displayName || '회원'
  const categoryHint = `${CATEGORIES.expense.slice(0, 3).join(' · ')} … 관리`

  return (
    <MyShell layoutClassName="pt-3 pb-2 md:py-8">
      <h1 className="text-[22px] font-extrabold tracking-tight">마이</h1>
      <p className="text-muted mt-0.5 mb-3 text-[13px] font-semibold">
        안녕하세요, {name}님 👋
      </p>

      <Link
        href="/my/profile"
        className="border-border bg-card hover:bg-accent/5 mb-3 flex items-center gap-3 rounded-[20px] border p-3 shadow-[0_6px_18px_rgba(44,62,80,0.05)] transition-colors"
      >
        <span className="border-accent/20 bg-accent/10 flex size-14 shrink-0 items-center justify-center rounded-[18px] border-2">
          <Image
            src={ghost.src}
            alt=""
            width={46}
            height={46}
            className="object-contain"
          />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-xl font-extrabold tracking-tight">
            {name}
          </span>
          <span className="text-muted mt-0.5 block truncate text-xs font-medium">
            {maskEmail(user.email)}
          </span>
          <span className="bg-accent/10 text-accent mt-2 inline-block rounded-full px-2.5 py-1 text-[10px] font-bold">
            프로필 보기 · 수정
          </span>
        </span>
      </Link>

      <h2 className="text-muted mb-2 px-0.5 text-[11px] font-bold">
        계정 · 예산
      </h2>
      <section className="border-border bg-card divide-border mb-3.5 divide-y overflow-hidden rounded-[18px] border">
        <HubRow
          href="/my/profile"
          icon={User}
          tone="blue"
          title="프로필"
          description="아바타 · 닉네임 · 계정"
        />
        <HubRow
          href="/my/budget"
          icon={Wallet}
          tone="green"
          title="예산 · 한도"
          description={
            loading
              ? '이번 달 지출을 불러오는 중'
              : `이번 달 ${monthExpense.toLocaleString()}원 · 한도 미설정`
          }
          pill={
            !loading && monthExpense > 0
              ? formatCompactAmount(monthExpense)
              : undefined
          }
        />
        <HubRow
          href="/my/categories"
          icon={Tag}
          tone="amber"
          title="카테고리"
          description={categoryHint}
        />
        <HubRow
          href="/my/recurring"
          icon={Repeat}
          tone="violet"
          title="반복 지출"
          description={
            loading
              ? '불러오는 중'
              : recurringSummary(recurring.map((item) => item.title))
          }
        />
      </section>

      <h2 className="text-muted mb-2 px-0.5 text-[11px] font-bold">앱 설정</h2>
      <section className="border-border bg-card divide-border divide-y overflow-hidden rounded-[18px] border">
        <HubRow
          href="/my/settings"
          icon={Bell}
          tone="blue"
          title="알림 · 테마"
          description="푸시 · 시스템 테마"
        />
        <HubRow
          href="/my/help"
          icon={Megaphone}
          tone="rose"
          title="공지 · 도움말"
          description="업데이트 · 문의"
        />
      </section>

      <Button
        type="button"
        variant="outline"
        onClick={handleLogout}
        className="text-expense hover:text-expense mt-3 h-11 w-full rounded-[14px] border-[1.5px] text-sm font-bold"
      >
        로그아웃
      </Button>
    </MyShell>
  )
}
