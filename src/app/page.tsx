'use client'

import { useEffect, useState } from 'react'
import { auth, db } from '@/lib/firebase'
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'
import { startOfMonth, endOfMonth, format } from 'date-fns' // 추가됨

import { SummaryCards } from './_components/SummaryCards'
import { TransactionList } from './_components/TransactionList'
import { AddTransactionBtn } from './_components/AddTransactionBtn'
import { MonthNavigator } from './_components/MonthNavigator'
import { Transaction } from './type/transaction.type'
import { TransactionCalendar } from './_components/TransactionCalendar'

export default function Home() {
  const [items, setItems] = useState<Transaction[]>([])

  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list')

  // 현재 선택된 월 상태
  const [currentDate, setCurrentDate] = useState(new Date())

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

    // 해당 월의 시작일과 종료일 계산 (예: '2024-02-01' ~ '2024-02-29')
    const start = format(startOfMonth(currentDate), 'yyyy-MM-dd')
    const end = format(endOfMonth(currentDate), 'yyyy-MM-dd')

    const q = query(
      collection(db, 'transactions'),
      where('userId', '==', user.uid),
      where('date', '>=', start), // 해당 월 시작보다 크거나 같고
      where('date', '<=', end), // 해당 월 끝보다 작거나 같은 것만!
      orderBy('date', 'desc'),
      orderBy('createdAt', 'desc'),
    )

    const unsubscribeData = onSnapshot(
      q,
      (snapshot) => {
        const transactionData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Transaction[]

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

  // 합계 계산 로직
  const totalIncome = items
    .filter((item) => item.type === 'income')
    .reduce((acc, cur) => acc + cur.amount, 0)

  const totalExpense = items
    .filter((item) => item.type === 'expense')
    .reduce((acc, cur) => acc + cur.amount, 0)

  if (loading && items.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center">
        데이터 로딩 중...
      </div>
    )
  }

  return (
    <main className="base-layout min-h-[calc(100vh-4rem)] space-y-6 py-6 pb-24">
      <MonthNavigator
        currentDate={currentDate}
        onChange={setCurrentDate}
        viewMode={viewMode}
        setViewMode={setViewMode}
      />

      <SummaryCards income={totalIncome} expense={totalExpense} />

      {items.length === 0 ? (
        <div className="py-20 text-center text-slate-400">
          이번 달에는 기록이 없어요!
        </div>
      ) : (
        <>
          {viewMode === 'calendar' ? (
            <TransactionCalendar currentDate={currentDate} items={items} />
          ) : (
            <TransactionList items={items} />
          )}
        </>
      )}

      <AddTransactionBtn />
    </main>
  )
}
