import { ArrowUpCircle, ArrowDownCircle, History } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type SummaryProps = {
  income: number
  expense: number
}

export function SummaryCards({ income, expense }: SummaryProps) {
  return (
    <section className="grid gap-4 md:grid-cols-2">
      <Card className="bg-card border-border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-muted text-sm font-medium">
            이번 달 수입
          </CardTitle>
          <ArrowUpCircle className="text-income h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-income text-2xl font-bold">
            + {income.toLocaleString()} 원
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-muted text-sm font-medium">
            이번 달 지출
          </CardTitle>
          <ArrowDownCircle className="text-expense h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-expense text-2xl font-bold">
            - {expense.toLocaleString()} 원
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
