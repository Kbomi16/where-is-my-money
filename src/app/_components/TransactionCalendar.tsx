'use client'

import * as React from 'react'
import { Calendar } from '@/components/ui/calendar'
import { Transaction } from '../type/transaction.type'
import { ko } from 'date-fns/locale'
import { format, isToday } from 'date-fns'
import { cn } from '@/lib/utils'
import { TransactionList } from './TransactionList'
import { DayButtonProps } from 'react-day-picker'

type TransactionCalendarProps = {
  currentDate: Date
  items: Transaction[]
}

const formatAmount = (amount: number) => {
  const wan = amount / 10000

  if (wan >= 1) {
    // 1만 원 이상일 때: 소수점 첫째 자리까지 표시하되, .0으로 끝나면 제거 (예: 1.5만, 2만)
    return wan % 1 === 0 ? `${wan}만` : `${wan.toFixed(1)}만`
  } else if (wan > 0) {
    // 1만 원 미만일 때: 0.x만 표시 (예: 0.3만)
    return `${wan.toFixed(1)}만`
  }
  return '0'
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
      {/* 달력 영역 */}
      <div className="w-full flex-1 overflow-hidden rounded-3xl border border-slate-100 bg-white p-2 shadow-sm md:p-6 dark:border-slate-800 dark:bg-slate-900">
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
            // table-fixed로 열 너비 고정, border-spacing 조절
            month_grid: 'w-full border-collapse table-fixed rounded-2xl',
            months: 'w-full',
            cell: 'relative p-[1px] text-center focus-within:relative focus-within:z-20',
            day: 'bg-transparent h-full w-full p-0 font-normal rounded-lg',
          }}
          components={{
            DayButton: (props: DayButtonProps) => {
              const { day, modifiers, ...buttonProps } = props
              const { date } = day
              const dateKey = format(date, 'yyyy-MM-dd')
              const stat = dailyStats[dateKey]
              const dayNumber = date.getDay()
              const isSelected = modifiers.selected
              const _isToday = isToday(date)

              return (
                <button
                  {...buttonProps}
                  className={cn(
                    buttonProps.className,
                    // 모바일 높이 h-[62px], 데스크톱 높이 h-24로 고정
                    'relative flex h-15.5 w-full flex-col items-center justify-start rounded-lg bg-transparent px-1 py-1.5 transition-all outline-none md:h-24 md:px-2.5 md:py-3',
                    isSelected
                      ? 'z-10 bg-blue-50 ring-1 ring-blue-500 dark:bg-slate-800 dark:ring-blue-400'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/50',
                    !isSelected &&
                      _isToday &&
                      'bg-slate-50 dark:bg-slate-800/50',
                  )}
                >
                  {/* 날짜 숫자 */}
                  <div className="flex items-center justify-center gap-1">
                    <span
                      className={cn(
                        'text-[11px] font-bold md:text-[13px]',
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
                    {/* 오늘 표시 점 */}
                    {_isToday && (
                      <span className="h-1 w-1 shrink-0 rounded-full bg-blue-500 md:h-1.5 md:w-1.5" />
                    )}
                  </div>

                  {/* 수입/지출 금액 요약 */}
                  <div className="mt-auto flex w-full flex-col items-center gap-0 md:gap-0.5">
                    {stat?.income > 0 && (
                      <span className="w-full truncate text-center text-[8px] leading-tight font-black text-emerald-500 md:text-[10px]">
                        +{formatAmount(stat.income)}
                      </span>
                    )}
                    {stat?.expense > 0 && (
                      <span className="w-full truncate text-center text-[8px] leading-tight font-black text-rose-500 md:text-[10px]">
                        -{formatAmount(stat.expense)}
                      </span>
                    )}
                  </div>
                </button>
              )
            },
          }}
        />
      </div>

      {/* 하단 리스트 영역 */}
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

        <div className="custom-scrollbar max-h-125 overflow-y-auto pr-2">
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
