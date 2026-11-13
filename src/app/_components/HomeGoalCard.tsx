'use client'

import { useEffect, useMemo, useState, type MouseEvent } from 'react'
import Link from 'next/link'
import { X } from 'lucide-react'
import { useAuthStore } from '@/app/store/useAuthStore'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { useMonthBudget } from '@/app/my/_hooks/useMonthBudget'
import {
  filterMonthExpenses,
  sumAmount,
} from '@/app/my/_hooks/useUserTransactions'
import { homeGoalCardModel, monthKeyFromDate } from '@/app/my/_lib/budgetGoal'
import {
  goalNudgeDismissValue,
  goalNudgeStorageKey,
  isGoalNudgeDismissed,
  monthLabelFromDate,
} from '@/app/_lib/homeGoalNudge'
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

const clayInset =
  'shadow-[inset_-6px_-8px_14px_rgba(0,0,0,.14),inset_6px_8px_14px_rgba(255,255,255,.75),8px_12px_20px_rgba(49,130,246,.18)]'

function ClayTarget({ className }: { className?: string }) {
  return (
    <div
      className={cn('relative size-24 shrink-0', className)}
      aria-hidden
    >
      <div
        className={cn(
          'absolute inset-0 rounded-full bg-[#ff7a7a]',
          clayInset,
        )}
      />
      <div
        className={cn(
          'absolute top-[16%] left-[16%] size-[68%] rounded-full bg-white',
          clayInset,
        )}
      />
      <div
        className={cn(
          'absolute top-[31%] left-[31%] size-[38%] rounded-full bg-[#ff7a7a]',
          clayInset,
        )}
      />
    </div>
  )
}

function ClayDart({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'h-2.5 w-[70px] rounded-[5px] bg-[#3182f6] shadow-[inset_0_-3px_4px_rgba(0,0,0,.2)]',
        className,
      )}
      aria-hidden
    />
  )
}

function GoalNudge({
  storageKey,
  monthLabel,
}: {
  storageKey: string
  monthLabel: string
}) {
  // null = 하이드레이션 전. SSR/첫 페인트에서 깜빡이지 않게 숨긴다.
  const [visible, setVisible] = useState<boolean | null>(null)

  useEffect(() => {
    try {
      setVisible(!isGoalNudgeDismissed(window.localStorage.getItem(storageKey)))
    } catch {
      setVisible(true)
    }
  }, [storageKey])

  const handleDismiss = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()
    try {
      window.localStorage.setItem(storageKey, goalNudgeDismissValue())
    } catch {
      // storage 실패해도 UI에서는 닫는다
    }
    setVisible(false)
  }

  if (visible !== true) return null

  return (
    <div
      className={cn(
        'goal-nudge-enter bg-card relative overflow-hidden rounded-[22px]',
        'shadow-[0_1px_2px_rgba(0,0,0,.04),0_10px_30px_rgba(30,60,120,.08)]',
        'dark:shadow-[0_1px_2px_rgba(0,0,0,.2),0_10px_30px_rgba(0,0,0,.35)]',
      )}
    >
      <Link
        href="/my/budget"
        className="focus-visible:ring-accent relative flex min-h-[88px] items-center gap-2 py-[22px] pr-12 pl-[100px] outline-none focus-visible:ring-2"
        aria-label={`${monthLabel} 목표 금액 정하기`}
      >
        <div className="pointer-events-none absolute -top-2 -left-3.5 z-[1]">
          <ClayTarget />
        </div>
        <div className="pointer-events-none absolute top-3.5 left-[34px] z-[2] -rotate-[35deg]">
          <ClayDart />
        </div>

        <span className="min-w-0 flex-1">
          <span className="text-muted block text-[13px] leading-snug font-medium">
            {monthLabel} 목표가 비어 있어요
          </span>
          <span className="text-foreground mt-0.5 inline-flex items-baseline gap-1 text-[17px] leading-none font-bold tracking-tight">
            목표 금액 정하기
            <span
              className="text-[21px] leading-none font-light text-[#b0b8c1] dark:text-zinc-500"
              aria-hidden
            >
              ›
            </span>
          </span>
        </span>
      </Link>
      <button
        type="button"
        aria-label="이번 달 목표 안내 닫기"
        onClick={handleDismiss}
        className="text-[#b0b8c1] hover:bg-black/5 hover:text-foreground focus-visible:ring-accent absolute top-2.5 right-2.5 z-[3] flex size-8 cursor-pointer items-center justify-center rounded-full outline-none focus-visible:ring-2 dark:hover:bg-white/10 dark:text-zinc-500"
      >
        <X size={15} strokeWidth={2.25} aria-hidden />
      </button>
    </div>
  )
}

export function HomeGoalCardView({
  model,
  nudgeKey,
  monthLabel,
}: {
  model: ReturnType<typeof homeGoalCardModel>
  nudgeKey: string
  monthLabel: string
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
    return <GoalNudge storageKey={nudgeKey} monthLabel={monthLabel} />
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
  const monthKey = monthKeyFromDate(today)

  return (
    <HomeGoalCardView
      model={model}
      nudgeKey={goalNudgeStorageKey(user?.uid, monthKey)}
      monthLabel={monthLabelFromDate(today)}
    />
  )
}
