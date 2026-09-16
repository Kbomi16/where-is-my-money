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

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div>
        <p className="text-sm font-black text-slate-800 dark:text-slate-100">
          {lastLabel}과 {currentLabel} 비교
        </p>
        <p
          className={cn(
            'mt-2 text-sm font-bold',
              insight.trend === 'down' && 'text-income',
              insight.trend === 'up' && 'text-expense',
            (insight.trend === 'same' || insight.trend === 'empty') &&
              'text-slate-500 dark:text-slate-400',
          )}
        >
          {insight.percent !== null && insight.trend !== 'same' ? (
            <>
              전달보다{' '}
              <span className="text-xl font-black tracking-tight">
                {insight.percent}%
              </span>{' '}
              {insight.trend === 'down' ? '줄었어요.' : '늘었어요.'}
            </>
          ) : (
            insight.message
          )}
        </p>
      </div>

      {loading ? (
        <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-16 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-950/40">
          불러오는 중...
        </div>
      ) : (
        <div className="mt-6 h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barGap={8} barCategoryGap="28%">
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#e2e8f0"
              />
              <XAxis
                dataKey="name"
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#64748b', fontSize: 12, fontWeight: 700 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                tickFormatter={formatAxis}
                width={42}
              />
              <Tooltip
                cursor={{ fill: 'rgba(148, 163, 184, 0.08)' }}
                formatter={(value) => formatWon(Number(value ?? 0))}
                contentStyle={{
                  borderRadius: 16,
                  border: '1px solid #e2e8f0',
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
                fill="#94a3b8"
                radius={[8, 8, 0, 0]}
                maxBarSize={42}
                isAnimationActive={false}
              />
              <Bar
                dataKey="current"
                name={currentLabel}
                fill="#1677ff"
                radius={[8, 8, 0, 0]}
                maxBarSize={42}
                isAnimationActive={false}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
