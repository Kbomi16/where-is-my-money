import { cn } from '@/lib/utils'

type ExpenseComparison = {
  percent: number | null
  trend: 'up' | 'down' | 'same' | 'empty'
}

type SummaryProps = {
  income: number
  expense: number
  expenseComparison?: ExpenseComparison | null
}

export function SummaryCards({
  income,
  expense,
  expenseComparison,
}: SummaryProps) {
  const showComparison =
    expenseComparison &&
    expenseComparison.trend !== 'empty' &&
    (expenseComparison.trend === 'same' || expenseComparison.percent !== null)

  return (
    <section className="grid grid-cols-2 gap-2">
      <div className="border-border bg-card rounded-2xl border px-3.5 py-3">
        <p className="text-muted text-[11px] font-semibold">이번 달 수입</p>
        <p className="text-income mt-1 text-[15px] font-extrabold tracking-tight md:text-xl">
          + {income.toLocaleString()}
        </p>
      </div>
      <div className="border-border bg-card rounded-2xl border px-3.5 py-3">
        <p className="text-muted text-[11px] font-semibold">이번 달 지출</p>
        <p className="text-expense mt-1 text-[15px] font-extrabold tracking-tight md:text-xl">
          − {expense.toLocaleString()}
        </p>
        {showComparison && expenseComparison.trend === 'same' && (
          <p className="text-muted mt-1 text-[11px] font-medium">
            전달과 같아요
          </p>
        )}
        {showComparison && expenseComparison.trend !== 'same' && (
          <p className="text-muted mt-1 text-[11px] leading-snug font-medium">
            전달보다{' '}
            <span
              className={cn(
                'font-bold',
                expenseComparison.trend === 'down'
                  ? 'text-income'
                  : 'text-expense',
              )}
            >
              {expenseComparison.percent}%
            </span>{' '}
            {expenseComparison.trend === 'down' ? '줄었어요' : '늘었어요'}
          </p>
        )}
      </div>
    </section>
  )
}
