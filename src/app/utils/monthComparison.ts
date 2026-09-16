import { endOfMonth, format, startOfMonth } from 'date-fns'
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
