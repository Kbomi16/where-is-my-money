import { endOfMonth, format, startOfMonth, subMonths } from 'date-fns'
import { Transaction } from '../type/transaction.type'

export type MonthTotals = {
  income: number
  expense: number
}

export const getMonthTotals = (
  items: Transaction[],
  monthDate: Date,
): MonthTotals => {
  const start = format(startOfMonth(monthDate), 'yyyy-MM-dd')
  const end = format(endOfMonth(monthDate), 'yyyy-MM-dd')

  return items
    .filter((item) => !item.isExclude && item.date >= start && item.date <= end)
    .reduce(
      (acc, item) => {
        if (item.type === 'income') acc.income += item.amount
        if (item.type === 'expense') acc.expense += item.amount
        return acc
      },
      { income: 0, expense: 0 },
    )
}

export const getExpenseInsight = (current: number, last: number) => {
  if (last === 0 && current === 0) {
    return {
      message: '이 달과 전달 지출 기록이 없어요.',
      percent: null,
      trend: 'empty' as const,
    }
  }
  if (last === 0) {
    return {
      message: '전달 지출 기록이 없어 비교할 수 없어요.',
      percent: null,
      trend: 'empty' as const,
    }
  }

  const diff = current - last
  const percent = Math.round((Math.abs(diff) / last) * 100)

  if (diff === 0) {
    return {
      message: '이 달 지출이 전달과 같아요.',
      percent: 0,
      trend: 'same' as const,
    }
  }

  if (diff > 0) {
    return {
      message: '전달보다 늘었어요.',
      percent,
      trend: 'up' as const,
    }
  }

  return {
    message: '전달보다 줄었어요.',
    percent,
    trend: 'down' as const,
  }
}

export type CategorySpend = {
  category: string
  amount: number
  percent: number
}

export type SpendTrend = 'up' | 'down' | 'same' | 'empty'

export type CategorySpendInsight = {
  lead: string
  highlight: string | null
  trend: SpendTrend
}

export type HomeSpendInsight = {
  total: number
  categories: CategorySpend[]
  top: CategorySpend | null
  comparison: CategorySpendInsight | null
}

const hasBatchim = (word: string) => {
  const code = word.charCodeAt(word.length - 1)
  if (Number.isNaN(code) || code < 0xac00 || code > 0xd7a3) return true
  return (code - 0xac00) % 28 !== 0
}

const withTopic = (category: string) =>
  `${category}${hasBatchim(category) ? '이' : '가'}`

export const getMonthExpenseByCategory = (
  items: Transaction[],
  monthDate: Date,
) => {
  const start = format(startOfMonth(monthDate), 'yyyy-MM-dd')
  const end = format(endOfMonth(monthDate), 'yyyy-MM-dd')
  const totals = new Map<string, number>()
  let total = 0

  for (const item of items) {
    if (item.isExclude || item.type !== 'expense') continue
    if (item.date < start || item.date > end) continue
    const amount = Number(item.amount) || 0
    if (amount <= 0) continue
    const category = item.category || '기타'
    totals.set(category, (totals.get(category) ?? 0) + amount)
    total += amount
  }

  const categories = [...totals.entries()]
    .map(([category, amount]) => ({
      category,
      amount,
      percent: total > 0 ? Math.round((amount / total) * 100) : 0,
    }))
    .sort(
      (a, b) =>
        b.amount - a.amount || a.category.localeCompare(b.category, 'ko'),
    )

  return { total, categories }
}

export const getCategorySpendInsight = (
  category: string,
  current: number,
  last: number,
): CategorySpendInsight => {
  if (last <= 0) {
    return {
      lead: `전달에는 ${category} 지출이 없었어요.`,
      highlight: null,
      trend: 'empty',
    }
  }

  const diff = current - last
  const percent = Math.round((Math.abs(diff) / last) * 100)

  if (diff === 0 || percent === 0) {
    return {
      lead: `전달과 ${withTopic(category)} 같아요.`,
      highlight: null,
      trend: 'same',
    }
  }

  if (diff > 0) {
    return {
      lead: `전달보다 ${withTopic(category)}`,
      highlight: `${percent}% 늘었어요.`,
      trend: 'up',
    }
  }

  return {
    lead: `전달보다 ${withTopic(category)}`,
    highlight: `${percent}% 줄었어요.`,
    trend: 'down',
  }
}

export const getHomeSpendInsight = (
  items: Transaction[],
  currentDate: Date,
): HomeSpendInsight => {
  const current = getMonthExpenseByCategory(items, currentDate)
  const previous = getMonthExpenseByCategory(items, subMonths(currentDate, 1))
  const top = current.categories[0] ?? null

  if (!top) {
    return {
      total: 0,
      categories: [],
      top: null,
      comparison: null,
    }
  }

  const lastAmount =
    previous.categories.find((item) => item.category === top.category)
      ?.amount ?? 0

  return {
    total: current.total,
    categories: current.categories,
    top,
    comparison: getCategorySpendInsight(top.category, top.amount, lastAmount),
  }
}
