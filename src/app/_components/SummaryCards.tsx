import { ArrowUpCircle, ArrowDownCircle, History } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type SummaryProps = {
  income: number
  expense: number
}

export function SummaryCards({ income, expense }: SummaryProps) {
  return (
    <section className="grid gap-4 md:grid-cols-2">
      <Card className="rounded-3xl border-slate-200 bg-white p-5 shadow-none dark:border-slate-800 dark:bg-slate-900">
        <CardHeader className="flex flex-row items-center justify-between px-0 pb-2">
          <CardTitle className="text-muted text-sm font-medium">
            이번 달 수입
          </CardTitle>
          <ArrowUpCircle className="text-income h-4 w-4" />
        </CardHeader>
        <CardContent className="px-0">
          <div className="text-income text-2xl font-bold">
            + {income.toLocaleString()} 원
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-slate-200 bg-white p-5 shadow-none dark:border-slate-800 dark:bg-slate-900">
        <CardHeader className="flex flex-row items-center justify-between px-0 pb-2">
          <CardTitle className="text-muted text-sm font-medium">
            이번 달 지출
          </CardTitle>
          <ArrowDownCircle className="text-expense h-4 w-4" />
        </CardHeader>
        <CardContent className="px-0">
          <div className="text-expense text-2xl font-bold">
            - {expense.toLocaleString()} 원
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
