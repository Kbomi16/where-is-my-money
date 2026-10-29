'use client'

import { useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
} from 'firebase/firestore'
import { endOfMonth, format, startOfMonth } from 'date-fns'
import { auth, db } from '@/lib/firebase'
import { Transaction } from '../type/transaction.type'
import { syncRecurringTransactions } from '../utils/recurring'

export function useMonthTransactions(currentDate: Date) {
  const [items, setItems] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUserId(currentUser?.uid ?? null)
      if (!currentUser) {
        setItems([])
        setLoading(false)
      }
    })
    return () => unsubscribeAuth()
  }, [])

  useEffect(() => {
    if (!userId) return

    setLoading(true)

    const transactionsQuery = query(
      collection(db, 'transactions'),
      where('userId', '==', userId),
      orderBy('date', 'desc'),
      orderBy('createdAt', 'desc'),
    )

    const unsubscribeData = onSnapshot(
      transactionsQuery,
      async (snapshot) => {
        const transactionData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Transaction[]

        await syncRecurringTransactions({
          currentDate,
          transactions: transactionData,
          userId,
          firestoreDb: db,
        })

        setItems(transactionData)
        setLoading(false)
      },
      (error) => {
        console.error('Firestore error:', error)
        setLoading(false)
      },
    )

    return () => unsubscribeData()
  }, [userId, currentDate])

  const start = format(startOfMonth(currentDate), 'yyyy-MM-dd')
  const end = format(endOfMonth(currentDate), 'yyyy-MM-dd')
  const monthItems = items.filter(
    (item) => item.date >= start && item.date <= end,
  )
  const statItems = monthItems.filter((item) => !item.isExclude)
  const totalIncome = statItems
    .filter((item) => item.type === 'income')
    .reduce((sum, item) => sum + item.amount, 0)
  const totalExpense = statItems
    .filter((item) => item.type === 'expense')
    .reduce((sum, item) => sum + item.amount, 0)

  return { items, monthItems, loading, totalIncome, totalExpense }
}
