'use client'

import { format, subMonths } from 'date-fns'
import { ko } from 'date-fns/locale'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Transaction } from '@/app/type/transaction.type'
import { cn } from '@/lib/utils'
import {
  getExpenseInsight,
  getMonthTotals,
} from '@/app/utils/monthComparison'

type MonthlyCompareSectionProps = {
  items: Transaction[]
  currentDate: Date
  loading: boolean
}

const formatWon = (value: number) => `${value.toLocaleString()}원`

const formatAxis = (value: number) => {
  if (value >= 10000) return `${Math.round(value / 10000)}만`
  return String(value)
}

export default function MonthlyCompareSection({
  items,
  currentDate,
  loading,
}: MonthlyCompareSectionProps) {
  const lastMonthDate = subMonths(currentDate, 1)
  const currentLabel = format(currentDate, 'M월', { locale: ko })
  const lastLabel = format(lastMonthDate, 'M월', { locale: ko })

  const currentTotals = getMonthTotals(items, currentDate)
  const lastTotals = getMonthTotals(items, lastMonthDate)
  const insight = getExpenseInsight(currentTotals.expense, lastTotals.expense)

  const chartData = [
    {
      name: '수입',
      last: lastTotals.income,
      current: currentTotals.income,
    },
    {
      name: '지출',
      last: lastTotals.expense,
      current: currentTotals.expense,
    },
  ]

  const comparisonText =
    insight.percent !== null && insight.trend !== 'same'
      ? `지출이 전달보다 ${insight.percent}% ${insight.trend === 'down' ? '줄었어요' : '늘었어요'}`
      : insight.message

  return (
    <section className="border-border bg-card rounded-[28px] border px-5 pt-5 pb-4">
      <p className="text-muted text-xs font-bold">전달과 비교</p>
      <h2 className="mt-1 text-lg font-extrabold tracking-tight">
        {lastLabel}과 {currentLabel}
      </h2>
      <p
        className={cn(
          'mt-1 text-sm font-medium',
          insight.trend === 'down' && 'text-income',
          insight.trend === 'up' && 'text-expense',
          (insight.trend === 'same' || insight.trend === 'empty') &&
            'text-muted',
        )}
      >
        {comparisonText}
      </p>

      {loading ? (
        <p className="text-muted py-16 text-center text-sm">
          비교를 불러오고 있어요.
        </p>
      ) : (
        <div className="mt-4 h-56 w-full md:h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barGap={8} barCategoryGap="28%">
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="var(--border)"
              />
              <XAxis
                dataKey="name"
                tickLine={false}
                axisLine={false}
                tick={{ fill: 'var(--foreground)', fontSize: 12, fontWeight: 700 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: 'var(--muted)', fontSize: 11 }}
                tickFormatter={formatAxis}
                width={42}
              />
              <Tooltip
                cursor={{ fill: 'color-mix(in srgb, var(--muted) 16%, transparent)' }}
                formatter={(value) => formatWon(Number(value ?? 0))}
                contentStyle={{
                  borderRadius: 16,
                  border: '1px solid var(--border)',
                  background: 'var(--card)',
                  color: 'var(--foreground)',
                  fontSize: 12,
                  fontWeight: 600,
                }}
              />
              <Legend
                iconType="circle"
                wrapperStyle={{ fontSize: 12, fontWeight: 700 }}
              />
              <Bar
                dataKey="last"
                name={lastLabel}
                fill="var(--muted)"
                radius={[8, 8, 0, 0]}
                maxBarSize={42}
                isAnimationActive={false}
              />
              <Bar
                dataKey="current"
                name={currentLabel}
                fill="var(--accent)"
                radius={[8, 8, 0, 0]}
                maxBarSize={42}
                isAnimationActive={false}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  )
}
