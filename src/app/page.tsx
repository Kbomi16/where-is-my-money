'use client'

import { useEffect, useRef, useState } from 'react'
import { auth, db } from '@/lib/firebase'
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'
import { startOfMonth, endOfMonth, format } from 'date-fns'

import { SummaryCards } from './_components/SummaryCards'
import { TransactionList } from './_components/TransactionList'
import { AddTransactionBtn } from './_components/AddTransactionBtn'
import { MonthNavigator } from './_components/MonthNavigator'
import { HomeInsight } from './_components/HomeInsight'
import { Transaction } from './type/transaction.type'
import { TransactionCalendar } from './_components/TransactionCalendar'
import { syncRecurringTransactions } from './utils/recurring'

export default function Home() {
  const [items, setItems] = useState<Transaction[]>([])

  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list')

  // 현재 선택된 월 상태
  const [currentDate, setCurrentDate] = useState(new Date())

  const viewSectionRef = useRef<HTMLDivElement>(null)
  const isFirstViewMode = useRef(true)

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      if (!currentUser) {
        setItems([])
        setLoading(false)
      }
    })
    return () => unsubscribeAuth()
  }, [])

  useEffect(() => {
    if (!user) return

    setLoading(true)

    const q = query(
      collection(db, 'transactions'),
      where('userId', '==', user.uid),
      orderBy('date', 'desc'),
      orderBy('createdAt', 'desc'),
    )

    const unsubscribeData = onSnapshot(
      q,
      async (snapshot) => {
        const transactionData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Transaction[]

        await syncRecurringTransactions({
          currentDate,
          transactions: transactionData,
          userId: user.uid,
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
  }, [user, currentDate])

  useEffect(() => {
    if (isFirstViewMode.current) {
      isFirstViewMode.current = false
      return
    }

    viewSectionRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }, [viewMode])

  const start = format(startOfMonth(currentDate), 'yyyy-MM-dd')
  const end = format(endOfMonth(currentDate), 'yyyy-MM-dd')

  const monthItems = items.filter(
    (item) => item.date >= start && item.date <= end,
  )

  const statItems = monthItems.filter((item) => !item.isExclude)

  const totalIncome = statItems
    .filter((item) => item.type === 'income')
    .reduce((acc, cur) => acc + cur.amount, 0)

  const totalExpense = statItems
    .filter((item) => item.type === 'expense')
    .reduce((acc, cur) => acc + cur.amount, 0)

  return (
    <main className="base-layout min-h-[calc(100vh-4rem)] space-y-3 py-4 pb-8">
      <MonthNavigator
        currentDate={currentDate}
        onChange={setCurrentDate}
        viewMode={viewMode}
        setViewMode={setViewMode}
      />

      <HomeInsight
        items={items}
        currentDate={currentDate}
        loading={loading && items.length === 0}
      />

      <SummaryCards income={totalIncome} expense={totalExpense} />

      <AddTransactionBtn />

      <div ref={viewSectionRef} className="scroll-mt-20">
        {loading && items.length === 0 ? (
          <p className="text-muted py-16 text-center text-sm">
            기록을 불러오고 있어요.
          </p>
        ) : viewMode === 'calendar' ? (
          <TransactionCalendar currentDate={currentDate} items={monthItems} />
        ) : monthItems.length === 0 ? (
          <p className="text-muted py-16 text-center text-sm">
            이번 달에는 기록이 없어요.
          </p>
        ) : (
          <TransactionList items={monthItems} />
        )}
      </div>
    </main>
  )
}
