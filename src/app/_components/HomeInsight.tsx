'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import { getCategoryIconSrc } from '../constants/categoryIcons'
import { Transaction } from '../type/transaction.type'
import { getHomeSpendInsight } from '../utils/monthComparison'

const SLICE_COLORS = [
  'var(--accent)',
  'color-mix(in srgb, var(--accent) 62%, white)',
  'color-mix(in srgb, var(--accent) 36%, white)',
]

const formatShare = (percent: number, amount: number) => {
  if (amount > 0 && percent === 0) return '<1%'
  return `${percent}%`
}

function SpendDonut({
  slices,
}: {
  slices: { amount: number; color: string }[]
}) {
  const size = 168
  const stroke = 22
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const center = size / 2
  const total = slices.reduce((sum, slice) => sum + slice.amount, 0)
  let offset = 0

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className="size-full"
      aria-hidden
    >
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke="var(--border)"
        strokeWidth={stroke}
      />
      {total > 0 &&
        slices.map((slice, index) => {
          const length = (slice.amount / total) * circumference
          const isFull = length >= circumference - 0.01
          const node = (
            <circle
              key={index}
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={slice.color}
              strokeWidth={stroke}
              strokeDasharray={
                isFull ? undefined : `${length} ${circumference - length}`
              }
              strokeDashoffset={isFull ? undefined : -offset}
              transform={`rotate(-90 ${center} ${center})`}
            />
          )
          offset += length
          return node
        })}
    </svg>
  )
}

export function HomeInsight({
  items,
  currentDate,
  loading,
}: {
  items: Transaction[]
  currentDate: Date
  loading: boolean
}) {
  const insight = useMemo(
    () => getHomeSpendInsight(items, currentDate),
    [items, currentDate],
  )
  const top = insight.top
  const top3 = insight.categories.slice(0, 3)
  const restAmount = Math.max(
    0,
    insight.total - top3.reduce((sum, item) => sum + item.amount, 0),
  )
  const slices = [
    ...top3.map((item, index) => ({
      amount: item.amount,
      color: SLICE_COLORS[index],
    })),
    ...(restAmount > 0
      ? [{ amount: restAmount, color: 'var(--border)' }]
      : []),
  ]

  if (loading) {
    return (
      <section className="border-border bg-card rounded-[28px] border px-5 py-16 text-center">
        <p className="text-muted text-sm font-medium">
          이번 달 인사이트를 불러오고 있어요.
        </p>
      </section>
    )
  }

  if (!top) {
    return (
      <section className="border-border bg-card rounded-[28px] border px-5 py-8">
        <p className="text-muted text-xs font-bold">이번 달 인사이트</p>
        <h2 className="mt-2 text-2xl leading-snug font-extrabold tracking-tight">
          이번 달 지출이 아직 없어요
        </h2>
        <p className="text-muted mt-2 text-sm leading-relaxed">
          지출을 기록하면 어디에 제일 많이 썼는지 알려드릴게요.
        </p>
      </section>
    )
  }

  const comparison = insight.comparison

  return (
    <div className="space-y-3">
      <section className="border-border bg-card rounded-[28px] border px-5 pt-5 pb-4">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-muted text-xs font-bold">이번 달 인사이트</p>
          <span className="bg-accent/10 text-accent rounded-full px-2.5 py-1 text-[11px] font-bold">
            최대 카테고리
          </span>
        </div>
        <h2 className="mb-5 text-2xl leading-snug font-extrabold tracking-tight md:text-3xl">
          이번 달, <em className="text-accent not-italic">{top.category}</em>에
          <br />
          제일 많이 썼어요
        </h2>
        <div className="flex items-center gap-5">
          <div className="relative size-[168px] shrink-0 md:size-[200px]">
            <SpendDonut slices={slices} />
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-accent text-4xl leading-none font-extrabold tracking-tight">
                {formatShare(top.percent, top.amount)}
              </p>
              <p className="mt-1.5 text-sm font-bold">{top.category}</p>
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-accent mb-1 text-xs font-bold">
              1위 · {top.category}
            </p>
            <p className="text-3xl leading-none font-extrabold tracking-tight md:text-4xl">
              {top.amount.toLocaleString()}원
            </p>
            <p className="text-muted mt-2 text-sm font-medium">
              전체 지출의{' '}
              <b className="text-foreground font-bold">
                {formatShare(top.percent, top.amount)}
              </b>
            </p>
          </div>
        </div>
        {comparison && (
          <p
            className={cn(
              'mt-4 rounded-2xl border px-3.5 py-3 text-sm leading-relaxed font-medium',
              comparison.trend === 'down'
                ? 'border-income/25 bg-income/10'
                : comparison.trend === 'up'
                  ? 'border-accent/20 bg-accent/10'
                  : 'border-border bg-background',
            )}
          >
            {comparison.lead}{' '}
            {comparison.highlight && (
              <strong
                className={cn(
                  'font-bold',
                  comparison.trend === 'down' ? 'text-income' : 'text-accent',
                )}
              >
                {comparison.highlight}
              </strong>
            )}
          </p>
        )}
      </section>

      <section className="border-border bg-card rounded-3xl border px-4 pt-4 pb-1">
        <h3 className="mb-1 flex items-baseline gap-1.5 text-sm font-bold">
          카테고리 Top 3
          <span className="text-muted text-[10px] font-medium">금액 · 비율</span>
        </h3>
        {top3.map((item, index) => {
          const width = top.amount > 0 ? (item.amount / top.amount) * 100 : 0
          return (
            <div
              key={item.category}
              className="border-border flex items-center gap-3 border-b py-3 last:border-b-0"
            >
              <span
                className={cn(
                  'grid size-[22px] shrink-0 place-items-center rounded-[7px] text-center text-[11px] leading-none font-extrabold text-white',
                  index === 0 && 'bg-accent',
                  index === 1 && 'bg-accent/70',
                  index === 2 && 'bg-accent/40',
                )}
              >
                {index + 1}
              </span>
              <span className="size-7 shrink-0 overflow-hidden rounded-[9px]">
                <img
                  src={getCategoryIconSrc(item.category)}
                  alt=""
                  className="size-full object-cover"
                />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold">{item.category}</p>
                <div className="bg-border mt-2 h-2 overflow-hidden rounded-full">
                  <div
                    className={cn(
                      'h-full rounded-full',
                      index === 0 && 'bg-accent',
                      index === 1 && 'bg-accent/70',
                      index === 2 && 'bg-accent/40',
                    )}
                    style={{ width: `${Math.max(width, 4)}%` }}
                  />
                </div>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-bold">
                  {item.amount.toLocaleString()}원
                </p>
                <p className="text-muted text-[11px] font-semibold">
                  {formatShare(item.percent, item.amount)}
                </p>
              </div>
            </div>
          )
        })}
      </section>
    </div>
  )
}
