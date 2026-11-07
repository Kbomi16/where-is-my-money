'use client'

import { useEffect, useState } from 'react'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Transaction } from '@/app/type/transaction.type'
import {
  filterMonthExpenses,
  filterRecurring,
  sumAmount,
} from '../_lib/transactionMonth'

export { filterMonthExpenses, filterRecurring, sumAmount }

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
