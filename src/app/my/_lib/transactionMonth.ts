import { endOfMonth, format, startOfMonth } from 'date-fns'
import type { Transaction } from '@/app/type/transaction.type'

export function filterMonthExpenses(transactions: Transaction[], date: Date) {
  const start = format(startOfMonth(date), 'yyyy-MM-dd')
  const end = format(endOfMonth(date), 'yyyy-MM-dd')

  return transactions.filter(
    (item) =>
      item.type === 'expense' &&
      !item.isExclude &&
      item.date >= start &&
      item.date <= end,
  )
}

export function filterRecurring(transactions: Transaction[]) {
  return transactions
    .filter((item) => item.recurringEnabled)
    .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))
}

export function sumAmount(items: Transaction[]) {
  return items.reduce((sum, item) => sum + item.amount, 0)
}
