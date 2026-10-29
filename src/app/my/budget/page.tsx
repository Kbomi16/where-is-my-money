'use client'

import { useMemo } from 'react'
import { toast } from 'sonner'
import { CATEGORIES } from '@/app/constants/categories'
import { getCategoryIconSrc } from '@/app/constants/categoryIcons'
import { useAuthStore } from '@/app/store/useAuthStore'
import { Button } from '@/components/ui/button'
import MyDetailHeader from '../_components/MyDetailHeader'
import MyShell from '../_components/MyShell'
import {
  filterMonthExpenses,
  sumAmount,
  useUserTransactions,
} from '../_hooks/useUserTransactions'
import { daysUntilMonthEndLabel, formatMonthLabel } from '../_lib/myFormat'

// TODO: 월 예산·카테고리 한도 저장 모델이 없습니다.
// 사용액만 이번 달 거래(통계 제외 제외)로 계산하고, 한도 수정은 저장하지 않습니다.
// 한도가 생기면 사용률 막대와 80% 초과 경고를 여기서 계산하면 됩니다.

export default function BudgetPage() {
  const { user } = useAuthStore()
  const today = useMemo(() => new Date(), [])
  const { transactions, loading } = useUserTransactions(user?.uid)

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

  const handleEditBudget = () => {
    toast('예산 한도 저장은 아직 준비 중이에요.')
  }

  if (!user) return null

  return (
    <MyShell className="gap-3">
      <MyDetailHeader
        title="예산 · 한도"
        action={
          <button
            type="button"
            onClick={handleEditBudget}
            className="text-accent px-2 py-1 text-[13px] font-extrabold"
          >
            수정
          </button>
        }
      />

      <section className="border-border bg-card rounded-[20px] border px-4 py-4 shadow-[0_6px_18px_rgba(44,62,80,0.05)]">
        <p className="text-muted text-[11px] font-bold">
          {formatMonthLabel(today)} · 월 예산
        </p>
        <p className="mt-1.5 text-[28px] leading-none font-extrabold tracking-tight">
          미설정
        </p>
        <p className="text-accent mt-2 text-sm font-bold">
          {loading
            ? '이번 달 지출을 불러오는 중'
            : `이번 달 지출 ${total.toLocaleString()}원`}
        </p>

        <div className="mt-3.5 grid grid-cols-2 gap-2">
          <div className="bg-background border-border rounded-xl border px-3 py-2.5">
            <p className="text-muted text-[10px] font-bold">사용</p>
            <p className="text-accent mt-0.5 text-[15px] font-extrabold tracking-tight">
              {loading ? '…' : total.toLocaleString()}
            </p>
          </div>
          <div className="bg-background border-border rounded-xl border px-3 py-2.5">
            <p className="text-muted text-[10px] font-bold">남음</p>
            <p className="text-income mt-0.5 text-[15px] font-extrabold tracking-tight">
              —
            </p>
          </div>
        </div>

        <div className="mt-3.5 h-3 overflow-hidden rounded-full bg-[#eef2f6] dark:bg-white/10">
          <div className="bg-accent h-full w-0 rounded-full" />
        </div>
        <div className="mt-2 flex items-center justify-between gap-3 text-[11px] font-bold">
          <span className="text-accent">한도를 정하면 사용률이 보여요</span>
          <span className="text-muted shrink-0">
            {daysUntilMonthEndLabel(today)}
          </span>
        </div>
      </section>

      <section className="border-border bg-card rounded-[18px] border px-3.5 py-3.5">
        <h2 className="text-[13px] font-extrabold">카테고리 한도</h2>
        <p className="text-muted mt-1 mb-1 text-[11px] font-medium">
          이번 달 쓴 금액이에요. 한도는 아직 저장되지 않아요.
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
                    <p className="text-muted shrink-0 text-[11px] font-semibold">
                      {loading ? '…' : `${spent.toLocaleString()}원`}
                    </p>
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

      <Button
        type="button"
        onClick={handleEditBudget}
        className="h-12 w-full rounded-[14px] text-[15px] font-extrabold"
      >
        예산 · 한도 수정하기
      </Button>
    </MyShell>
  )
}
