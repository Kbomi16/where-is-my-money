'use client'

import { useState } from 'react'
import { MonthNavigator } from '../_components/MonthNavigator'
import { TransactionCalendar } from '../_components/TransactionCalendar'
import { TransactionList } from '../_components/TransactionList'
import { useMonthTransactions } from '../hooks/useMonthTransactions'
import {
  CalendarSkeleton,
  TransactionListSkeleton,
} from '@/components/common/ContentSkeleton'
import PageHeader from '@/components/common/PageHeader'
import PageLayout from '@/components/common/PageLayout'

export default function HistoryPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list')
  const { monthItems, loading } = useMonthTransactions(currentDate)

  return (
    <PageLayout>
      <PageHeader
        title="내역"
        description="들어온 돈과 나간 돈을 모아 봐요"
      />
      <div className="flex flex-col gap-4 md:gap-6">
        <MonthNavigator
          currentDate={currentDate}
          onChange={setCurrentDate}
          viewMode={viewMode}
          setViewMode={setViewMode}
        />
        {loading && monthItems.length === 0 ? (
          viewMode === 'calendar' ? (
            <CalendarSkeleton />
          ) : (
            <TransactionListSkeleton />
          )
        ) : viewMode === 'calendar' ? (
          <TransactionCalendar currentDate={currentDate} items={monthItems} />
        ) : (
          <TransactionList
            items={monthItems}
            emptyMessage="이번 달 내역이 없어요."
            className="md:grid md:grid-cols-2 md:items-stretch md:gap-3 md:space-y-0"
          />
        )}
      </div>
    </PageLayout>
  )
}
