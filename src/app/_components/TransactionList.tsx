'use client'

import {
  CreditCard,
  Wallet,
  Utensils,
  ShoppingBag,
  Coffee,
  MoreHorizontal,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Transaction } from '../type/transaction.type'

// 카테고리별 아이콘 매핑 (예시)
const categoryIcons: Record<string, React.ReactNode> = {
  식비: <Utensils className="h-3.5 w-3.5" />,
  생활: <ShoppingBag className="h-3.5 w-3.5" />,
  카페: <Coffee className="h-3.5 w-3.5" />,
  기타: <MoreHorizontal className="h-3.5 w-3.5" />,
}

export function TransactionList({ items }: { items: Transaction[] }) {
  return (
    <div className="space-y-3">
      {items.length > 0 ? (
        items.map((item) => (
          <div
            key={item.id}
            className="group relative flex items-center justify-between overflow-hidden rounded-4xl border border-slate-50 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-center gap-4">
              {/* 왼쪽 아이콘 영역 */}
              <div
                className={cn(
                  'flex h-12 w-12 items-center justify-center rounded-2xl transition-colors',
                  item.type === 'income'
                    ? 'bg-emerald-50 text-emerald-500 dark:bg-emerald-950/30'
                    : 'bg-slate-50 text-slate-500 dark:bg-slate-800',
                )}
              >
                {item.type === 'income' ? (
                  <Wallet size={20} />
                ) : (
                  categoryIcons[item.category] || <CreditCard size={20} />
                )}
              </div>

              {/* 중앙 정보 영역 */}
              <div className="space-y-1">
                <p className="line-clamp-1 text-sm font-bold text-slate-800 dark:text-slate-100">
                  {item.title}
                </p>
                <div className="flex items-center gap-2">
                  {/* 카테고리 태그 */}
                  <span className="flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                    {item.category}
                  </span>

                  {/* 결제 수단 태그 (지출일 때만 표시) */}
                  {item.type === 'expense' && item.method && (
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-[10px] font-black',
                        item.method === 'credit'
                          ? 'bg-purple-50 text-purple-500 dark:bg-purple-950/30'
                          : 'bg-blue-50 text-blue-500 dark:bg-blue-950/30',
                      )}
                    >
                      {item.method === 'credit'
                        ? '신용'
                        : item.method === 'check'
                          ? '체크'
                          : '현금'}
                    </span>
                  )}

                  <span className="text-[10px] font-medium text-slate-400">
                    {item.date}
                  </span>
                </div>
              </div>
            </div>

            {/* 오른쪽 금액 영역 */}
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
          </div>
        ))
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <div className="mb-4 rounded-full bg-slate-50 p-6 dark:bg-slate-900">
            <MoreHorizontal size={40} className="opacity-20" />
          </div>
          <p className="text-sm font-medium">아직 기록된 내역이 없어요</p>
        </div>
      )}
    </div>
  )
}
