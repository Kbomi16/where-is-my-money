type SummaryProps = {
  income: number
  expense: number
}

export function SummaryCards({ income, expense }: SummaryProps) {
  return (
    <section className="grid grid-cols-2 gap-2">
      <div className="border-border bg-card rounded-2xl border px-3.5 py-3">
        <p className="text-muted text-[11px] font-semibold">이번 달 수입</p>
        <p className="text-income mt-1 text-[15px] font-extrabold tracking-tight">
          + {income.toLocaleString()}
        </p>
      </div>
      <div className="border-border bg-card rounded-2xl border px-3.5 py-3">
        <p className="text-muted text-[11px] font-semibold">이번 달 지출</p>
        <p className="text-expense mt-1 text-[15px] font-extrabold tracking-tight">
          − {expense.toLocaleString()}
        </p>
      </div>
    </section>
  )
}
