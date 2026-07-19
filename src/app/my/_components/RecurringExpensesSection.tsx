'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { db } from '@/lib/firebase'
import { Transaction } from '@/app/type/transaction.type'
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { toast } from 'sonner'

type RecurringExpensesSectionProps = {
  recurringExpenses: Transaction[]
  recurringLoading: boolean
  userId?: string | null
}

export default function RecurringExpensesSection({
  recurringExpenses,
  recurringLoading,
  userId,
}: RecurringExpensesSectionProps) {
  const [targetItem, setTargetItem] = useState<Transaction | null>(null)
  const [isStopping, setIsStopping] = useState(false)

  const handleStopRecurring = async () => {
    if (!userId || !targetItem) return

    setIsStopping(true)
    try {
      await updateDoc(doc(db, 'transactions', targetItem.id), {
        recurringEnabled: false,
        updatedAt: serverTimestamp(),
      })

      toast.success('반복 지출을 중단했어요.')
      setTargetItem(null)
    } catch (error) {
      console.error('Failed to stop recurring expense:', error)
      toast.error('반복 지출을 중단하지 못했어요.')
    } finally {
      setIsStopping(false)
    }
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-black text-slate-800 dark:text-slate-100">
            매달 반복되는 지출
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            정기적으로 기록한 지출을 한눈에 확인해요.
          </p>
        </div>
        <div className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
          {recurringExpenses.length}개
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {recurringLoading ? (
          <div className="rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-950/40">
            불러오는 중...
          </div>
        ) : recurringExpenses.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-4 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950/40">
            아직 정기 지출이 없어요.
          </div>
        ) : (
          recurringExpenses.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-950/40"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-bold text-slate-800 dark:text-slate-100">
                    {item.title}
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {item.category}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-black text-rose-500">
                  {item.amount.toLocaleString()}원
                </p>
              </div>

              <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                  <span className="rounded-full bg-white px-2.5 py-1 dark:bg-slate-800">
                    매월
                  </span>
                  <span className="rounded-full bg-white px-2.5 py-1 dark:bg-slate-800">
                    {item.recurringEndType === 'months'
                      ? `${item.recurringMonths}개월 동안`
                      : '종료 없음'}
                  </span>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 rounded-full border-slate-200 px-3 text-xs font-semibold text-slate-600 hover:border-slate-300 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                  onClick={() => setTargetItem(item)}
                >
                  중단하기
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      <AlertDialog
        open={!!targetItem}
        onOpenChange={(open) => !open && setTargetItem(null)}
      >
        <AlertDialogContent className="max-w-[90vw] rounded-3xl border-none">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base">
              정말 중단할까요?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              반복 지출을 중단하면 앞으로는 이 항목이 자동으로 등록되지 않아요.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 flex-row gap-2">
            <AlertDialogCancel className="flex-1 rounded-xl border-none bg-slate-100 text-slate-600">
              취소
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleStopRecurring()
              }}
              disabled={isStopping}
              className="flex-1 rounded-xl bg-rose-500 text-white hover:bg-rose-600"
            >
              {isStopping ? '중단 중...' : '중단'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
