'use client'

import { useMemo } from 'react'
import { useAuthStore } from '@/app/store/useAuthStore'
import MyDetailHeader from '../_components/MyDetailHeader'
import MyShell from '../_components/MyShell'
import RecurringExpensesSection from '../_components/RecurringExpensesSection'
import {
  filterRecurring,
  useUserTransactions,
} from '../_hooks/useUserTransactions'

export default function RecurringPage() {
  const { user } = useAuthStore()
  const { transactions, loading } = useUserTransactions(user?.uid)
  const recurringExpenses = useMemo(
    () => filterRecurring(transactions),
    [transactions],
  )

  if (!user) return null

  return (
    <MyShell>
      <MyDetailHeader title="반복 지출" />
      <RecurringExpensesSection
        recurringExpenses={recurringExpenses}
        recurringLoading={loading}
        userId={user.uid}
      />
    </MyShell>
  )
}
