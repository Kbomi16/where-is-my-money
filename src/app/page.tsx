'use client'

import { useState } from 'react'
import { SummaryCards } from './_components/SummaryCards'
import { MonthNavigator } from './_components/MonthNavigator'
import { HomeInsight } from './_components/HomeInsight'
import { useMonthTransactions } from './hooks/useMonthTransactions'

export default function Home() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const { items, loading, totalIncome, totalExpense } =
    useMonthTransactions(currentDate)

  return (
    <main className="base-layout min-h-[calc(100vh-4rem)] py-4 pb-8">
      <div className="mx-auto flex w-full max-w-lg flex-col gap-4">
        <MonthNavigator
          currentDate={currentDate}
          onChange={setCurrentDate}
          showViewToggle={false}
        />

        <HomeInsight
          items={items}
          currentDate={currentDate}
          loading={loading && items.length === 0}
        />

        <SummaryCards income={totalIncome} expense={totalExpense} />
      </div>
    </main>
  )
}
