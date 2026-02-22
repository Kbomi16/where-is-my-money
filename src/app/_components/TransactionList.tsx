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
    <div className="space-y-2 md:space-y-3">
      {items.length > 0 ? (
        items.map((item) => (
          <div
            key={item.id}
            className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white transition-all dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-center justify-between p-3 md:p-4">
              <div className="flex items-center gap-3 md:gap-4">
                {/* 카테고리 아이콘: 모바일에서 크기 축소 */}
                <div
                  className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors md:h-12 md:w-12 md:rounded-2xl',
                    item.type === 'income'
                      ? 'bg-emerald-50 text-emerald-500'
                      : 'bg-slate-50 text-slate-500',
                  )}
                >
                  {categoryIcons[item.category] ||
                    (item.type === 'income' ? (
                      <Wallet size={18} />
                    ) : (
                      <CreditCard size={18} />
                    ))}
                </div>

                <div className="min-w-0 space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    {item.memo && (
                      <button
                        onClick={() =>
                          setOpenMemoId(openMemoId === item.id ? null : item.id)
                        }
                        className={cn(
                          'flex h-5 w-5 cursor-pointer items-center justify-center rounded-full transition-all',
                          openMemoId === item.id
                            ? 'bg-blue-500 text-white'
                            : 'bg-slate-100 text-slate-400',
                        )}
                      >
                        <MessageSquare
                          size={10}
                          fill={
                            openMemoId === item.id ? 'currentColor' : 'none'
                          }
                        />
                      </button>
                    )}
                    <p className="truncate text-[13px] font-bold text-slate-800 md:text-sm dark:text-slate-100">
                      {item.title}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-slate-50 px-1.5 py-0.5 text-[9px] font-bold text-slate-400 dark:bg-slate-800">
                      {item.category}
                    </span>
                  </div>
                </div>
              </div>

              {/* 우측 금액 및 편집 버튼 섹션 */}
              <div className="flex items-center gap-2 md:gap-4">
                <div className="text-right">
                  <p
                    className={cn(
                      'text-sm font-black tracking-tight md:text-base',
                      item.type === 'income'
                        ? 'text-emerald-500'
                        : 'text-slate-900 dark:text-white',
                    )}
                  >
                    {item.type === 'income' ? '+' : ''}
                    {item.amount.toLocaleString()}
                    <span className="ml-0.5 text-[10px] font-normal opacity-70">
                      원
                    </span>
                  </p>
                </div>

                {/* 편집/삭제 버튼: 모바일에서는 가로로 배치하여 높이 절약 */}
                <div className="flex items-center gap-0.5 md:flex-col md:gap-1">
                  <button
                    onClick={() => {
                      setEditingItem(item)
                      setIsOpenEditModal(true)
                    }}
                    className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-slate-300 transition-colors hover:bg-blue-50 hover:text-blue-500"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => setDeleteTargetId(item.id)}
                    className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-slate-300 transition-colors hover:bg-rose-50 hover:text-rose-500"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>

            {/* 메모 영역: 더 콤팩트하게 */}
            {item.memo && openMemoId === item.id && (
              <div className="animate-in slide-in-from-top-1 fade-in border-t border-blue-50/50 bg-blue-50/30 px-3 py-2 text-[11px] text-blue-600/80">
                <p className="leading-snug">
                  <span className="mr-1.5 font-bold">●</span>
                  {item.memo}
                </p>
              </div>
            )}
          </div>
        ))
      ) : (
        <div className="flex flex-col items-center justify-center py-10 text-slate-400">
          <p className="text-xs font-medium">기록된 내역이 없어요 👻</p>
        </div>
      )}

      {/* AlertDialog 및 Modal 코드는 기존과 동일 */}
      <AlertDialog
        open={!!deleteTargetId}
        onOpenChange={(open) => !open && setDeleteTargetId(null)}
      >
        <AlertDialogContent className="max-w-[90vw] rounded-3xl border-none">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base">
              정말 삭제할까요?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              삭제된 내역은 복구할 수 없어요.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 flex-row gap-2">
            <AlertDialogCancel className="flex-1 rounded-xl border-none bg-slate-100 text-slate-600">
              취소
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleDelete()
              }}
              disabled={isDeleting}
              className="flex-1 rounded-xl bg-rose-500 text-white hover:bg-rose-600"
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
