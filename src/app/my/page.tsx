'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/app/store/useAuthStore'
import { Button } from '@/components/ui/button'
import { auth, db } from '@/lib/firebase'
import { signOut } from 'firebase/auth'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { LogOut, User } from 'lucide-react'
import PageHeader from '@/components/common/PageHeader'
import PageLayout from '@/components/common/PageLayout'
import AccountSection from './_components/AccountSection'
import ProfileSection from './_components/ProfileSection'
import RecurringExpensesSection from './_components/RecurringExpensesSection'
import { Transaction } from '@/app/type/transaction.type'

export default function MyPage() {
  const { user } = useAuthStore()
  const router = useRouter()
  const [recurringExpenses, setRecurringExpenses] = useState<Transaction[]>([])
  const [recurringLoading, setRecurringLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setRecurringExpenses([])
      setRecurringLoading(false)
      return
    }

    setRecurringLoading(true)

    const q = query(
      collection(db, 'transactions'),
      where('userId', '==', user.uid),
    )

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Transaction[]

        const recurringItems = items
          .filter((item) => item.recurringEnabled)
          .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))

        setRecurringExpenses(recurringItems)
        setRecurringLoading(false)
      },
      (error) => {
        console.error('Recurring expenses listener error:', error)
        setRecurringExpenses([])
        setRecurringLoading(false)
      },
    )

    return () => unsubscribe()
  }, [user])

  const handleLogout = async () => {
    try {
      await signOut(auth)
      toast.success('로그아웃 되었습니다...')
      router.push('/login')
    } catch (error) {
      toast.error('로그아웃 중 오류가 발생했습니다.')
    }
  }

  if (!user) return null

  return (
    <PageLayout className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader
        icon={User}
        title="마이페이지"
        description={`${user.displayName}님의 정보를 확인하고 관리해보세요.`}
      />

      <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] md:gap-8">
        <div className="order-1 flex flex-col gap-6">
          <ProfileSection user={user} />
          <AccountSection user={user} />

          <Button
            variant="ghost"
            className="h-14 w-full rounded-2xl border border-rose-100 bg-rose-50/30 font-bold text-rose-500 transition-all hover:bg-rose-50 hover:text-rose-600 dark:border-rose-900/30 dark:bg-rose-900/10"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-5 w-5" />
            로그아웃
          </Button>
        </div>

        <div className="order-2 flex flex-col gap-6">
          <RecurringExpensesSection
            recurringExpenses={recurringExpenses}
            recurringLoading={recurringLoading}
            userId={user?.uid}
          />
        </div>
      </div>
    </PageLayout>
  )
}
