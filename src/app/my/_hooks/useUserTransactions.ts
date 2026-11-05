'use client'

import { useEffect, useState } from 'react'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { endOfMonth, format, startOfMonth } from 'date-fns'
import { db } from '@/lib/firebase'
import { Transaction } from '@/app/type/transaction.type'

export function useUserTransactions(userId?: string | null) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) {
      setTransactions([])
      setLoading(false)
      return
    }

    setLoading(true)

    const transactionsQuery = query(
      collection(db, 'transactions'),
      where('userId', '==', userId),
    )

    const unsubscribe = onSnapshot(
      transactionsQuery,
      (snapshot) => {
        setTransactions(
          snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Transaction[],
        )
        setLoading(false)
      },
      (error) => {
        console.error('Transactions listener error:', error)
        setTransactions([])
        setLoading(false)
      },
    )

    return () => unsubscribe()
  }, [userId])

  return { transactions, loading }
}

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
