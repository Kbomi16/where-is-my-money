'use client'

import { useState } from 'react'
import { MonthNavigator } from '../_components/MonthNavigator'
import { TransactionCalendar } from '../_components/TransactionCalendar'
import { TransactionList } from '../_components/TransactionList'
import { useMonthTransactions } from '../hooks/useMonthTransactions'
import PageLayout from '@/components/common/PageLayout'

export default function HistoryPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list')
  const { monthItems, loading } = useMonthTransactions(currentDate)

  return (
    <PageLayout>
      <div className="flex flex-col gap-4 md:gap-6">
        <h1 className="px-1 text-lg font-bold md:text-3xl">내역</h1>
        <MonthNavigator
          currentDate={currentDate}
          onChange={setCurrentDate}
          viewMode={viewMode}
          setViewMode={setViewMode}
        />
        {loading && monthItems.length === 0 ? (
          <p className="text-muted py-16 text-center text-sm">
            내역을 불러오고 있어요.
          </p>
        ) : viewMode === 'calendar' ? (
          <TransactionCalendar currentDate={currentDate} items={monthItems} />
        ) : monthItems.length === 0 ? (
          <p className="text-muted py-16 text-center text-sm">
            이번 달 내역이 없어요.
          </p>
        ) : (
          <TransactionList
            items={monthItems}
            className="md:grid md:grid-cols-2 md:gap-3 md:space-y-0"
          />
        )}
      </div>
    </PageLayout>
  )
}
