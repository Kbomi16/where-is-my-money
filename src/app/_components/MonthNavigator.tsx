'use client'

import { format, addMonths, subMonths, setYear, setMonth } from 'date-fns'
import { ko } from 'date-fns/locale'
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  List,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type MonthNavigatorProps = {
  currentDate: Date
  onChange: (date: Date) => void
  viewMode: 'list' | 'calendar'
  setViewMode: (mode: 'list' | 'calendar') => void
}

export function MonthNavigator({
  currentDate,
  onChange,
  viewMode,
  setViewMode,
}: MonthNavigatorProps) {
  const nextMonth = () => onChange(addMonths(currentDate, 1))
  const prevMonth = () => onChange(subMonths(currentDate, 1))

  const currentYear = new Date().getFullYear()

  // 🔥 2000년부터 현재 연도까지 배열 생성
  const startYear = 2000
  const years = Array.from(
    { length: currentYear - startYear + 1 },
    (_, i) => startYear + i,
  ).reverse() // 최신 연도가 위로 오도록 역순 정렬 (선택 사항)

  const months = Array.from({ length: 12 }, (_, i) => i + 1)

  const handleYearChange = (year: string) => {
    onChange(setYear(currentDate, parseInt(year)))
  }

  const handleMonthChange = (month: string) => {
    onChange(setMonth(currentDate, parseInt(month) - 1))
  }

  return (
    <section className="flex items-center justify-between rounded-2xl border border-white/20 bg-white/40 p-2 shadow-sm backdrop-blur-md dark:bg-slate-900/40">
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={prevMonth}
          className="hover:bg-accent/10 hover:text-accent rounded-xl"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>

        {/* 📅 연도/월 선택 영역 */}
        <div className="flex items-center gap-0">
          <Select
            value={currentDate.getFullYear().toString()}
            onValueChange={handleYearChange}
          >
            <SelectTrigger className="h-8 w-auto gap-1 border-none bg-transparent px-2 font-black text-slate-700 focus:ring-0 dark:text-slate-200">
              <SelectValue />
            </SelectTrigger>

            <SelectContent
              position="popper"
              className="max-h-40 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-2xl dark:bg-slate-800"
            >
              <div className="max-h-40 overflow-y-auto [ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {years.map((y) => (
                  <SelectItem
                    key={y}
                    value={y.toString()}
                    className="cursor-pointer"
                  >
                    {y}년
                  </SelectItem>
                ))}
              </div>
            </SelectContent>
          </Select>
          <Select
            value={(currentDate.getMonth() + 1).toString()}
            onValueChange={handleMonthChange}
          >
            <SelectTrigger className="h-8 w-auto gap-1 border-none bg-transparent px-2 font-black text-slate-700 focus:ring-0 dark:text-slate-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent
              position="popper"
              className="max-h-40 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-2xl dark:bg-slate-800"
            >
              <div className="max-h-40 overflow-y-auto [ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {months.map((m) => (
                  <SelectItem
                    key={m}
                    value={m.toString()}
                    className="font-medium"
                  >
                    {m}월
                  </SelectItem>
                ))}{' '}
              </div>
            </SelectContent>
          </Select>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={nextMonth}
          className="hover:bg-accent/10 hover:text-accent rounded-xl"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      <Tabs
        value={viewMode}
        onValueChange={(v) => setViewMode(v as any)}
        className="hidden sm:block"
      >
        <TabsList className="grid h-9 w-40 grid-cols-2 rounded-xl bg-slate-200/50 dark:bg-slate-800/50">
          <TabsTrigger
            value="list"
            className="cursor-pointer rounded-lg text-xs font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700"
          >
            <List className="mr-1.5 h-3.5 w-3.5" />
            리스트
          </TabsTrigger>
          <TabsTrigger
            value="calendar"
            className="cursor-pointer rounded-lg text-xs font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700"
          >
            <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
            달력
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </section>
  )
}
