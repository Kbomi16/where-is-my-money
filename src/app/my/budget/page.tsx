'use client'

import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { CATEGORIES } from '@/app/constants/categories'
import { getCategoryIconSrc } from '@/app/constants/categoryIcons'
import { useAuthStore } from '@/app/store/useAuthStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import MyDetailHeader from '../_components/MyDetailHeader'
import MyShell from '../_components/MyShell'
import { useMonthBudget } from '../_hooks/useMonthBudget'
import {
  filterMonthExpenses,
  sumAmount,
  useUserTransactions,
} from '../_hooks/useUserTransactions'
import {
  compareWithPreviousMonth,
  dailyRecommendation,
  formatUsagePercent,
  resolveDisplayedGoal,
  summarizeGoalUsage,
} from '../_lib/budgetGoal'
import { daysUntilMonthEndLabel, formatMonthLabel } from '../_lib/myFormat'

// TODO: 월 예산·카테고리 한도 저장 모델이 없습니다.
// 사용액만 이번 달 거래(통계 제외 제외)로 계산하고, 한도 수정은 저장하지 않습니다.
// 한도가 생기면 사용률 막대와 80% 초과 경고를 여기서 계산하면 됩니다.

export default function BudgetPage() {
  const { user } = useAuthStore()
  const today = useMemo(() => new Date(), [])
  const { transactions, loading: transactionsLoading } = useUserTransactions(
    user?.uid,
  )
  const budget = useMonthBudget(user?.uid, today)
  const [form, setForm] = useState({ sourceKey: '', text: '' })

  const expenses = useMemo(
    () => filterMonthExpenses(transactions, today),
    [transactions, today],
  )
  const total = sumAmount(expenses)
  const spentByCategory = useMemo(() => {
    const totals = new Map<string, number>()
    for (const item of expenses) {
      totals.set(item.category, (totals.get(item.category) ?? 0) + item.amount)
    }
    return totals
  }, [expenses])
  const maxSpent = Math.max(0, ...spentByCategory.values())
  const displayed = resolveDisplayedGoal(
    budget.savedAmount,
    budget.previousAmount,
  )
  const usage = summarizeGoalUsage(
    total,
    budget.loading || transactionsLoading ? null : displayed.amount,
  )
  const daily = dailyRecommendation(
    usage.hasGoal && !transactionsLoading ? usage.remaining : null,
    today,
  )
  const previousDate = useMemo(() => {
    const [year, month] = budget.previousKey.split('-').map(Number)
    return new Date(year, month - 1, 1)
  }, [budget.previousKey])
  const previousSpent = sumAmount(
    filterMonthExpenses(transactions, previousDate),
  )
  const comparison = compareWithPreviousMonth({
    previousGoal: budget.loading ? null : budget.previousAmount,
    previousSpent,
    currentSpent: total,
  })
  const sourceKey = `${budget.monthKey}:${budget.savedAmount ?? 'none'}:${budget.previousAmount ?? 'none'}`

  if (!budget.loading && form.sourceKey !== sourceKey) {
    setForm({
      sourceKey,
      text: displayed.amount == null ? '' : String(displayed.amount),
    })
  }

  const handleSave = async () => {
    const result = await budget.save(form.text)
    if (result.ok) toast.success('이번 달 목표를 저장했어요.')
  }

  if (!user) return null

  const monthTitle =
    displayed.amount == null ? '미설정' : `${displayed.amount.toLocaleString()}원`

  return (
    <MyShell className="gap-3">
      <MyDetailHeader
        title="예산 · 목표"
        description="이번 달 지출과 목표를 봐요"
      />

      <section className="border-border bg-card rounded-[20px] border px-4 py-4">
        <p className="text-muted text-[11px] font-bold">
          {formatMonthLabel(today)} · 월 목표
        </p>
        {budget.loading ? (
          <Skeleton className="mt-2 h-8 w-36" />
        ) : (
          <p className="mt-1.5 text-[28px] leading-none font-extrabold tracking-tight">
            {monthTitle}
          </p>
        )}
        {displayed.source === 'previous' && !budget.loading ? (
          <p className="text-muted mt-2 text-[11px] font-medium">
            지난달 목표를 기본값으로 보여 줘요. 저장하기 전에는 이번 달 기록이
            아니에요.
          </p>
        ) : null}
        {transactionsLoading ? (
          <Skeleton className="mt-2 h-4 w-40" />
        ) : (
          <p className="text-accent mt-2 text-sm font-bold">
            이번 달 지출 {total.toLocaleString()}원
          </p>
        )}

        <div className="mt-3.5 grid grid-cols-2 gap-2">
          <div className="bg-background border-border rounded-xl border px-3 py-2.5">
            <p className="text-muted text-[10px] font-bold">사용</p>
            {transactionsLoading ? (
              <Skeleton className="mt-1.5 h-5 w-16" />
            ) : (
              <p className="text-accent mt-0.5 text-[15px] font-extrabold tracking-tight">
                {total.toLocaleString()}
              </p>
            )}
          </div>
          <div className="bg-background border-border rounded-xl border px-3 py-2.5">
            <p className="text-muted text-[10px] font-bold">
              {usage.overAmount > 0 ? '초과' : '남음'}
            </p>
            {budget.loading || transactionsLoading ? (
              <Skeleton className="mt-1.5 h-5 w-16" />
            ) : (
              <p
                className={`mt-0.5 text-[15px] font-extrabold tracking-tight ${usage.overAmount > 0 ? 'text-expense' : 'text-income'}`}
              >
                {usage.hasGoal
                  ? usage.overAmount > 0
                    ? usage.overAmount.toLocaleString()
                    : usage.remaining?.toLocaleString()
                  : '—'}
              </p>
            )}
          </div>
        </div>

        <div
          className="mt-3.5 h-3 overflow-hidden rounded-full bg-[#eef2f6] dark:bg-white/10"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={
            usage.hasGoal ? Math.round(usage.barPercent) : undefined
          }
          aria-valuetext={
            usage.hasGoal && usage.percent != null
              ? `${formatUsagePercent(usage.percent)} 사용 중`
              : '목표 없음'
          }
        >
          <div
            className={`h-full rounded-full ${usage.overAmount > 0 ? 'bg-expense' : 'bg-accent'}`}
            style={{ width: `${usage.barPercent}%` }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between gap-3 text-[11px] font-bold">
          {budget.loading || transactionsLoading ? (
            <Skeleton className="h-3 w-40" />
          ) : (
            <span
              className={usage.overAmount > 0 ? 'text-expense' : 'text-accent'}
            >
              {usage.hasGoal && usage.percent != null
                ? `${formatUsagePercent(usage.percent)} 사용 중${displayed.source === 'previous' ? ' · 저장 전' : ''}`
                : '목표를 정하면 사용률이 보여요'}
            </span>
          )}
          <span className="text-muted shrink-0">
            {daysUntilMonthEndLabel(today)}
          </span>
        </div>
        {usage.overAmount > 0 ? (
          <p className="text-expense mt-2 text-[12px] font-bold">
            목표보다 {usage.overAmount.toLocaleString()}원 초과했어요.
          </p>
        ) : null}
        {daily.amount != null ? (
          <p className="text-muted mt-2 text-[11px] font-medium">
            남은 일수는 오늘을 포함해 {daily.daysIncludingToday}일이에요. 하루
            권장 {daily.amount.toLocaleString()}원
            {usage.overAmount > 0 ? ' · 초과분은 권장 금액에 넣지 않아요' : ''}
          </p>
        ) : null}
      </section>

      {comparison && !transactionsLoading && !budget.loading ? (
        <section className="border-border bg-card rounded-[18px] border px-3.5 py-3.5">
          <h2 className="text-[13px] font-extrabold">지난달과 비교</h2>
          <p className="text-muted mt-1 text-[11px] font-medium">
            지난달 결과는 그달이 끝난 기준이에요. 이번 달 지출은 아직 진행
            중이라 지난달 전체보다 적어 보일 수 있어요.
          </p>
          <p className="mt-3 text-[13px] font-bold">
            지난달 목표 {budget.previousAmount?.toLocaleString()}원 · 지출{' '}
            {previousSpent.toLocaleString()}원 ·{' '}
            {comparison.achieved
              ? '목표 안에 들었어요'
              : `${comparison.overAmount.toLocaleString()}원 초과했어요`}
          </p>
          <p className="text-muted mt-1 text-[12px] font-medium">
            이번 달 {total.toLocaleString()}원 · 지난달{' '}
            {previousSpent.toLocaleString()}원 ·{' '}
            {comparison.spentDelta === 0
              ? '지난달과 같은 금액이에요'
              : comparison.spentDelta > 0
                ? `지난달보다 ${comparison.spentDelta.toLocaleString()}원 더 썼어요`
                : `지난달보다 ${Math.abs(comparison.spentDelta).toLocaleString()}원 덜 썼어요`}{' '}
            (진행 중)
          </p>
          <p className="text-muted mt-1 text-[11px] font-medium">
            {comparison.ratio == null
              ? '지난달 지출이 0원이라 비율은 계산하지 않아요.'
              : `이번 달 지출은 지난달 지출의 ${formatUsagePercent(comparison.ratio * 100)}예요.`}
          </p>
        </section>
      ) : null}

      <section className="border-border bg-card rounded-[18px] border px-3.5 py-3.5">
        <h2 className="text-[13px] font-extrabold">이번 달 목표</h2>
        <p className="text-muted mt-1 text-[11px] font-medium">
          저장한 목표는 이 계정에 남아요.
        </p>
        {budget.currentError || budget.previousError ? (
          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="text-expense text-[12px] font-bold">
              {budget.currentError ?? budget.previousError}
            </p>
            <Button
              type="button"
              variant="outline"
              className="h-8 rounded-full px-3 text-xs shadow-none"
              onClick={budget.retry}
            >
              다시 시도
            </Button>
          </div>
        ) : null}
        {budget.loading ? (
          <Skeleton className="mt-3 h-11 w-full" />
        ) : (
          <form
            className="mt-3 flex flex-col gap-2"
            onSubmit={(event) => {
              event.preventDefault()
              void handleSave()
            }}
          >
            <label className="text-[11px] font-bold" htmlFor="month-goal">
              목표 금액
            </label>
            <Input
              id="month-goal"
              inputMode="numeric"
              autoComplete="off"
              value={form.text}
              aria-invalid={budget.saveError ? true : undefined}
              placeholder="예: 300000"
              className="border-border bg-background h-11 rounded-xl"
              onChange={(event) => {
                budget.clearSaveError()
                setForm({ sourceKey: form.sourceKey, text: event.target.value })
              }}
            />
            {displayed.source === 'previous' ? (
              <p className="text-muted text-[11px] font-medium">
                지난달 금액을 채워 두었어요. 그대로 저장하거나 바꾼 뒤 저장해
                주세요.
              </p>
            ) : null}
            {budget.saveError ? (
              <p className="text-expense text-[12px] font-bold">
                {budget.saveError}
              </p>
            ) : null}
            <Button
              type="submit"
              disabled={budget.saving}
              className="h-11 rounded-[14px] text-sm font-extrabold"
            >
              {budget.saving ? '저장 중...' : '이번 달 목표 저장하기'}
            </Button>
          </form>
        )}
      </section>

      <section className="border-border bg-card rounded-[18px] border px-3.5 py-3.5">
        <h2 className="text-[13px] font-extrabold">카테고리 목표</h2>
        <p className="text-muted mt-1 mb-1 text-[11px] font-medium">
          이번 달 쓴 금액이에요. 카테고리 목표는 아직 저장되지 않아요.
        </p>

        <ul>
          {CATEGORIES.expense.map((category) => {
            const spent = spentByCategory.get(category) ?? 0
            const width = maxSpent > 0 ? (spent / maxSpent) * 100 : 0

            return (
              <li
                key={category}
                className="border-border flex items-center gap-2.5 border-b py-2.5 last:border-b-0"
              >
                <span className="bg-background flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-xl">
                  <img
                    src={getCategoryIconSrc(category)}
                    alt=""
                    className="size-7 object-cover"
                  />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-[13px] font-bold">{category}</p>
                    {transactionsLoading ? (
                      <Skeleton className="h-3 w-12" />
                    ) : (
                      <p className="text-muted shrink-0 text-[11px] font-semibold">
                        {spent.toLocaleString()}원
                      </p>
                    )}
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#eef2f6] dark:bg-white/10">
                    <div
                      className="bg-accent h-full rounded-full"
                      style={{ width: `${width}%` }}
                    />
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      </section>
    </MyShell>
  )
}
