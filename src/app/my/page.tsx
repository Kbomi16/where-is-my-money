'use client'

import { useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signOut } from 'firebase/auth'
import { Bell, Megaphone, Repeat, Tag, User, Wallet } from 'lucide-react'
import { toast } from 'sonner'
import { GHOST_IMAGES } from '@/app/constants/ghosts'
import { useCategoryPreference } from './_hooks/useCategoryPreference'
import { categoryHint as buildCategoryHint } from './_lib/categoryPreference'
import { useAuthStore } from '@/app/store/useAuthStore'
import { auth } from '@/lib/firebase'
import PageHeader from '@/components/common/PageHeader'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { HubRow } from './_components/HubRow'
import MyShell from './_components/MyShell'
import { useMonthBudget } from './_hooks/useMonthBudget'
import {
  filterMonthExpenses,
  filterRecurring,
  sumAmount,
  useUserTransactions,
} from './_hooks/useUserTransactions'
import { hubGoalDescription } from './_lib/budgetGoal'
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
  const budget = useMonthBudget(user?.uid, today)
  const categories = useCategoryPreference(user?.uid)

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
  const categoryHint = categories.loading
    ? '카테고리를 불러오는 중'
    : buildCategoryHint(categories.overrides)

  return (
    <MyShell className="md:max-w-none">
      <PageHeader title="마이" description={`안녕하세요, ${name}님 👋`} />

      <div className="grid grid-cols-1 items-start gap-3 md:grid-cols-2 md:gap-6">
      <Link
        href="/my/profile"
        className="border-border bg-card hover:bg-accent/5 flex items-center gap-3 rounded-[20px] border p-3 transition-colors md:p-5"
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

      <div>
      <h2 className="text-muted mb-2 px-0.5 text-[11px] font-bold">
        계정 · 예산
      </h2>
      <section className="border-border bg-card divide-border mb-3.5 divide-y overflow-hidden rounded-[18px] border">
        <HubRow
          href="/my/profile"
          icon={User}
          tone="blue"
          title="프로필"
          description="닉네임과 계정"
        />
        <HubRow
          href="/my/budget"
          icon={Wallet}
          tone="green"
          title="예산 · 목표"
          description={
            loading || budget.loading ? (
              <Skeleton className="h-3 w-36" />
            ) : budget.currentError ? (
              `이번 달 ${monthExpense.toLocaleString()}원 · 목표 확인 실패`
            ) : (
              hubGoalDescription(monthExpense, budget.savedAmount)
            )
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
            loading ? (
              <Skeleton className="h-3 w-24" />
            ) : (
              recurringSummary(recurring.map((item) => item.title))
            )
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
          description="알림과 화면 밝기"
        />
        <HubRow
          href="/my/help"
          icon={Megaphone}
          tone="rose"
          title="공지 · 도움말"
          description="소식과 문의"
        />
      </section>

      <Button
        type="button"
        variant="outline"
        onClick={handleLogout}
        className="border-expense/40 text-expense hover:border-expense/60 hover:bg-expense/5 hover:text-expense mt-3 h-11 w-full rounded-[14px] text-sm font-bold shadow-none"
      >
        로그아웃
      </Button>
      </div>
      </div>
    </MyShell>
  )
}
