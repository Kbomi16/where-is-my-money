'use client'

import * as React from 'react'
import { Calendar } from '@/components/ui/calendar'
import { Transaction } from '../type/transaction.type'
import { ko } from 'date-fns/locale'
import { format, isToday } from 'date-fns'
import { cn } from '@/lib/utils'
import { TransactionList } from './TransactionList'
import { DayButtonProps } from 'react-day-picker'

interface TransactionCalendarProps {
  currentDate: Date
  items: Transaction[]
}

export function TransactionCalendar({
  currentDate,
  items,
}: TransactionCalendarProps) {
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(
    currentDate,
  )

  const dailyStats = React.useMemo(() => {
    const stats: Record<string, { income: number; expense: number }> = {}
    items.forEach((item) => {
      if (!stats[item.date]) {
        stats[item.date] = { income: 0, expense: 0 }
      }
      if (item.type === 'income') {
        stats[item.date].income += item.amount
      } else {
        stats[item.date].expense += item.amount
      }
    })
    return stats
  }, [items])

  const selectedDayItems = React.useMemo(() => {
    if (!selectedDate) return []
    const dateStr = format(selectedDate, 'yyyy-MM-dd')
    return items.filter((item) => item.date === dateStr)
  }, [selectedDate, items])

  return (
    <div className="flex w-full flex-col gap-6 lg:flex-row">
      <div className="w-full flex-1 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <Calendar
          mode="single"
          locale={ko}
          month={currentDate}
          selected={selectedDate}
          onSelect={setSelectedDate}
          disableNavigation
          showOutsideDays
          className="w-full p-0"
          classNames={{
            root: 'w-full rounded-2xl',
            month_grid: 'w-full border-collapse',
            months: 'w-full',
            cell: 'relative p-0 text-center first:[&:has([aria-selected])]:rounded-2xl last:[&:has([aria-selected])]:rounded-2xl focus-within:relative focus-within:z-20',
            day: 'h-full w-full p-0 font-normal min-h-20 rounded-xl',
          }}
          components={{
            DayButton: (props: DayButtonProps) => {
              const { day, modifiers, ...buttonProps } = props
              const { date } = day

              const dateKey = format(date, 'yyyy-MM-dd')
              const stat = dailyStats[dateKey]
              const dayNumber = date.getDay()
              const isSelected = modifiers.selected
              const _isToday = isToday(date) // 🔥 오늘 여부 확인

              return (
                <button
                  {...buttonProps}
                  className={cn(
                    buttonProps.className,
                    'relative flex h-full min-h-24 w-full flex-col items-start justify-between px-2.5 py-3 transition-all outline-none',
                    isSelected &&
                      'z-10 rounded-2xl bg-white shadow-[0_0_15px_rgba(59,130,246,0.2)] ring-2 ring-blue-500 dark:bg-slate-950 dark:ring-blue-400',
                    !isSelected && _isToday && 'bg-slate-200',
                  )}
                >
                  {/* 날짜 영역 */}
                  <div className="flex items-center gap-1.5">
                    <span
                      className={cn(
                        'rounded-md text-[13px] font-bold',
                        isSelected
                          ? 'text-blue-600 dark:text-blue-400'
                          : dayNumber === 0
                            ? 'text-rose-500'
                            : dayNumber === 6
                              ? 'text-blue-500'
                              : 'text-slate-600 dark:text-slate-400',
                      )}
                    >
                      {date.getDate()}
                    </span>

                    {/* 🔥 오늘 표기 배지 */}
                    {_isToday && (
                      <span
                        className={cn(
                          'rounded-full px-1.5 py-0.5 text-[9px] font-bold',
                          isSelected
                            ? 'bg-blue-500 text-white'
                            : 'bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400',
                        )}
                      >
                        오늘
                      </span>
                    )}
                  </div>

                  {/* 수입/지출 내역 */}
                  <div className="mt-auto flex w-full flex-col items-end gap-1">
                    {stat?.income > 0 && (
                      <span className="text-[10px] leading-none font-black text-emerald-500">
                        +{stat.income.toLocaleString()}
                      </span>
                    )}
                    {stat?.expense > 0 && (
                      <span className="text-[10px] leading-none font-black text-rose-500">
                        -{stat.expense.toLocaleString()}
                      </span>
                    )}
                  </div>
                </button>
              )
            },
          }}
        />
      </div>

      <div className="flex w-full flex-col gap-4 lg:w-96">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">
            {selectedDate
              ? format(selectedDate, 'M월 d일 내역')
              : '날짜를 선택하세요'}
          </h3>
          {selectedDayItems.length > 0 && (
            <span className="rounded-full bg-blue-500 px-2.5 py-0.5 text-[11px] font-bold text-white">
              {selectedDayItems.length}
            </span>
          )}
        </div>

        <div className="custom-scrollbar max-h-[600px] overflow-y-auto pr-2">
          {selectedDayItems.length > 0 ? (
            <TransactionList items={selectedDayItems} />
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-slate-100 py-20 text-center dark:border-slate-800">
              <p className="text-sm font-medium text-slate-400">
                이날은 기록된 내역이 없어요
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
