'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Wallet, X } from 'lucide-react'
import { useAuthStore } from '@/app/store/useAuthStore'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { useMonthBudget } from '@/app/my/_hooks/useMonthBudget'
import {
  filterMonthExpenses,
  sumAmount,
} from '@/app/my/_hooks/useUserTransactions'
import { homeGoalCardModel, monthKeyFromDate } from '@/app/my/_lib/budgetGoal'
import type { Transaction } from '@/app/type/transaction.type'

const toneText = {
  under: 'text-income',
  watch: 'text-amber-800 dark:text-amber-200',
  over: 'text-expense',
} as const

const toneBar = {
  under: 'bg-income',
  watch: 'bg-amber-500',
  over: 'bg-expense',
} as const

function GoalNudge({ storageKey }: { storageKey: string }) {
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    try {
      setHidden(window.localStorage.getItem(storageKey) === '1')
    } catch {
      setHidden(false)
    }
  }, [storageKey])

  const handleDismiss = () => {
    try {
      window.localStorage.setItem(storageKey, '1')
    } catch {
      setHidden(true)
      return
    }
    setHidden(true)
  }

  if (hidden) return null

  return (
    <div className="border-accent/20 bg-accent/5 relative rounded-2xl border">
      <Link
        href="/my/budget"
        className="hover:bg-accent/10 focus-visible:ring-accent flex items-center gap-3 rounded-2xl py-3.5 pr-12 pl-3.5 outline-none focus-visible:ring-2"
      >
        <span className="bg-card text-accent flex size-10 shrink-0 items-center justify-center rounded-xl">
          <Wallet size={18} strokeWidth={2.25} aria-hidden />
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-extrabold tracking-tight">
            이번 달 목표, 정해 볼까요?
          </span>
          <span className="text-muted mt-0.5 block text-[12px] leading-snug font-medium">
            아직 안 정했어요. 정해 두면 얼마 썼는지 바로 보여요.
          </span>
        </span>
      </Link>
      <button
        type="button"
        aria-label="이번 달 목표 안내 닫기"
        onClick={handleDismiss}
        className="text-muted hover:bg-accent/10 hover:text-foreground focus-visible:ring-accent absolute top-2 right-2 flex size-8 cursor-pointer items-center justify-center rounded-full outline-none focus-visible:ring-2"
      >
        <X size={16} aria-hidden />
      </button>
    </div>
  )
}

export function HomeGoalCardView({
  model,
  nudgeKey,
}: {
  model: ReturnType<typeof homeGoalCardModel>
  nudgeKey: string
}) {
  if (model.kind === 'loading') {
    return (
      <section
        aria-busy="true"
        aria-label="이번 달 목표를 불러오는 중"
        className="border-border bg-card rounded-2xl border px-3.5 py-3"
      >
        <Skeleton className="h-3 w-20" />
        <Skeleton className="mt-2 h-5 w-36" />
        <Skeleton className="mt-2 h-2 w-full" />
      </section>
    )
  }

  if (model.kind === 'error') {
    return (
      <Link
        href="/my/budget"
        className="border-border bg-card block rounded-2xl border px-3.5 py-3"
      >
        <p className="text-muted text-[11px] font-semibold">이번 달 목표</p>
        <p className="text-expense mt-1 text-[13px] leading-snug font-bold">
          {model.message}
        </p>
      </Link>
    )
  }

  if (model.kind === 'unset') {
    return <GoalNudge storageKey={nudgeKey} />
  }

  return (
    <Link
      href="/my/budget"
      className="border-border bg-card block rounded-2xl border px-3.5 py-3"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-muted text-[11px] font-semibold">이번 달 목표</p>
        <p className={cn('text-[12px] font-extrabold', toneText[model.tone])}>
          {model.percentLabel} {model.toneLabel}
        </p>
      </div>
      <p className="mt-1 text-[15px] font-extrabold tracking-tight md:text-lg">
        <span className={toneText[model.tone]}>
          {model.spent.toLocaleString()}원
        </span>
        <span className="text-muted text-[12px] font-semibold">
          {' '}
          / 목표 {model.goal.toLocaleString()}원
        </span>
      </p>
      <div
        className="mt-2 h-2 overflow-hidden rounded-full bg-[#eef2f6] dark:bg-white/10"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(model.barPercent)}
        aria-valuetext={`${model.percentLabel} ${model.toneLabel}`}
      >
        <div
          className={cn('h-full rounded-full', toneBar[model.tone])}
          style={{ width: `${model.barPercent}%` }}
        />
      </div>
      <p className="text-muted mt-2 text-[11px] leading-snug font-medium">
        {model.line}
      </p>
    </Link>
  )
}

export function HomeGoalCard({
  items,
  transactionsLoading,
}: {
  items: Transaction[]
  transactionsLoading: boolean
}) {
  const { user } = useAuthStore()
  const today = useMemo(() => new Date(), [])
  const budget = useMonthBudget(user?.uid, today)
  const spent = sumAmount(filterMonthExpenses(items, today))
  const model = homeGoalCardModel({
    budgetLoading: budget.loading,
    transactionsLoading,
    error: budget.currentError,
    savedAmount: budget.savedAmount,
    previousAmount: budget.previousAmount,
    spent,
    date: today,
  })

  return (
    <HomeGoalCardView
      model={model}
      nudgeKey={`goal-nudge:${user?.uid ?? 'local'}:${monthKeyFromDate(today)}`}
    />
  )
}
