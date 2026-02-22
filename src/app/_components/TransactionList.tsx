'use client'

import { useState } from 'react'
import {
  CreditCard,
  Wallet,
  Utensils,
  ShoppingBag,
  Coffee,
  MoreHorizontal,
  Bus,
  Stethoscope,
  Coins,
  Banknote,
  Gift,
  TrendingUp,
  Receipt,
  MessageSquare,
  Pencil,
  Trash2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Transaction } from '../type/transaction.type'

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
import { deleteDoc, doc } from 'firebase/firestore'
import { toast } from 'sonner'
import { db } from '@/lib/firebase'
import { AddTransactionModal } from './AddTransactionModal'

const categoryIcons: Record<string, React.ReactNode> = {
  식비: <Utensils size={20} />,
  교통: <Bus size={20} />,
  생활: <Receipt size={20} />,
  의료: <Stethoscope size={20} />,
  쇼핑: <ShoppingBag size={20} />,
  카페: <Coffee size={20} />,
  월급: <Banknote size={20} />,
  부수입: <Coins size={20} />,
  용돈: <Gift size={20} />,
  금융수익: <TrendingUp size={20} />,
  기타: <MoreHorizontal size={20} />,
}

export function TransactionList({ items }: { items: Transaction[] }) {
  const [openMemoId, setOpenMemoId] = useState<string | null>(null)

  const [isOpenEditModal, setIsOpenEditModal] = useState(false)
  const [editingItem, setEditingItem] = useState<Transaction | null>(null)

  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // ! 실제 삭제 수행 함수
  const handleDelete = async () => {
    if (!deleteTargetId) return

    setIsDeleting(true)
    try {
      await deleteDoc(doc(db, 'transactions', deleteTargetId))
      toast.success('내역이 삭제되었어요.')
      setDeleteTargetId(null)
    } catch (error) {
      toast.error('삭제 중 오류가 발생했어요.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-3">
      {items.length > 0 ? (
        items.map((item) => (
          <div
            key={item.id}
            className="group relative flex flex-col overflow-hidden rounded-3xl border border-slate-50 bg-white shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-colors',
                    item.type === 'income'
                      ? 'bg-emerald-50 text-emerald-500'
                      : 'bg-slate-50 text-slate-500',
                  )}
                >
                  {categoryIcons[item.category] ||
                    (item.type === 'income' ? (
                      <Wallet size={20} />
                    ) : (
                      <CreditCard size={20} />
                    ))}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {item.memo && (
                      <button
                        onClick={() =>
                          setOpenMemoId(openMemoId === item.id ? null : item.id)
                        }
                        className={cn(
                          'flex h-6 w-6 cursor-pointer items-center justify-center rounded-full transition-all',
                          openMemoId === item.id
                            ? 'bg-blue-500 text-white shadow-sm'
                            : 'bg-slate-100 text-slate-400',
                        )}
                      >
                        <MessageSquare
                          size={12}
                          fill={
                            openMemoId === item.id ? 'currentColor' : 'none'
                          }
                        />
                      </button>
                    )}
                    <p className="line-clamp-1 text-sm font-bold text-slate-800 dark:text-slate-100">
                      {item.title}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black text-slate-500">
                      {item.category}
                    </span>
                    <span className="text-[10px] font-medium text-slate-400">
                      {item.date}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p
                    className={cn(
                      'text-base font-black tracking-tight',
                      item.type === 'income'
                        ? 'text-emerald-500'
                        : 'text-slate-900 dark:text-white',
                    )}
                  >
                    {item.type === 'income' ? '+' : ''}
                    {item.amount.toLocaleString()}
                    <span className="ml-0.5 text-xs font-normal">원</span>
                  </p>
                </div>

                <div className="flex flex-col items-center gap-1">
                  <button
                    onClick={() => {
                      setEditingItem(item)
                      setIsOpenEditModal(true)
                    }}
                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-blue-50"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => setDeleteTargetId(item.id)}
                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-rose-50"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>

            {item.memo && openMemoId === item.id && (
              <div className="animate-in slide-in-from-top-2 fade-in border-t border-blue-100/50 bg-blue-50/50 px-4 py-3 text-xs text-blue-700">
                <div className="flex gap-2">
                  <div className="mt-0.5 shrink-0 font-bold">MEMO:</div>
                  <div className="leading-relaxed">{item.memo}</div>
                </div>
              </div>
            )}
          </div>
        ))
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <p className="text-sm font-medium">아직 기록된 내역이 없어요 👻</p>
        </div>
      )}

      <AlertDialog
        open={!!deleteTargetId}
        onOpenChange={(open) => !open && setDeleteTargetId(null)}
      >
        <AlertDialogContent className="rounded-3xl border-none">
          <AlertDialogHeader>
            <AlertDialogTitle>정말 삭제할까요?</AlertDialogTitle>
            <AlertDialogDescription>
              삭제된 거래 내역은 다시 복구할 수 없어요.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-2xl border border-slate-200 bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200">
              취소
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleDelete()
              }}
              disabled={isDeleting}
              className="rounded-2xl bg-rose-500 text-white transition-colors hover:bg-rose-600"
            >
              {isDeleting ? '삭제 중...' : '삭제'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {isOpenEditModal && (
        <AddTransactionModal
          open={isOpenEditModal}
          onOpenChange={setIsOpenEditModal}
          editingItem={editingItem}
        />
      )}
    </div>
  )
}
