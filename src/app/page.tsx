'use client'

import { useState } from 'react'
import { subMonths } from 'date-fns'
import { SummaryCards } from './_components/SummaryCards'
import { MonthNavigator } from './_components/MonthNavigator'
import { HomeInsight } from './_components/HomeInsight'
import MonthlyCompareSection from './_components/MonthlyCompareSection'
import { useMonthTransactions } from './hooks/useMonthTransactions'
import PageLayout from '@/components/common/PageLayout'
import { getExpenseInsight, getMonthTotals } from './utils/monthComparison'

export default function Home() {
  const [currentDate, setCurrentDate] = useState(new Date())

  const { items, loading, totalIncome, totalExpense } =
    useMonthTransactions(currentDate)

  const lastMonthExpense = getMonthTotals(
    items,
    subMonths(currentDate, 1),
  ).expense
  const expenseComparison = getExpenseInsight(totalExpense, lastMonthExpense)

  return (
    <PageLayout>
      <div className="flex flex-col gap-4 md:gap-6">
        <MonthNavigator
          currentDate={currentDate}
          onChange={setCurrentDate}
          showViewToggle={false}
        />

        <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] md:gap-6">
          <HomeInsight
            items={items}
            currentDate={currentDate}
            loading={loading && items.length === 0}
          />

          <div className="flex flex-col gap-4 md:gap-6">
            <SummaryCards
              income={totalIncome}
              expense={totalExpense}
              expenseComparison={expenseComparison}
            />

            <MonthlyCompareSection
              items={items}
              currentDate={currentDate}
              loading={loading && items.length === 0}
            />
          </div>
        </div>
      </div>
    </PageLayout>
  )
}
