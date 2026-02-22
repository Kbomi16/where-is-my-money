'use client'

import { format, addMonths, subMonths } from 'date-fns'
import { ko } from 'date-fns/locale'
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  List,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useState } from 'react'

type MonthNavigatorProps = {
  currentDate: Date
  onChange: (date: Date) => void
}

export function MonthNavigator({ currentDate, onChange }: MonthNavigatorProps) {
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list')

  const nextMonth = () => onChange(addMonths(currentDate, 1))
  const prevMonth = () => onChange(subMonths(currentDate, 1))

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
        <h2 className="text-md min-w-25 text-center font-bold text-slate-700 dark:text-slate-200">
          {format(currentDate, 'yyyy년 M월', { locale: ko })}
        </h2>
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
        <TabsList className="bg-accent/10 grid h-9 w-40 grid-cols-2 rounded-xl">
          <TabsTrigger
            value="list"
            className="cursor-pointer rounded-lg text-xs"
          >
            <List className="mr-1.5 h-3.5 w-3.5" />
            리스트
          </TabsTrigger>
          <TabsTrigger
            value="calendar"
            className="cursor-pointer rounded-lg text-xs"
          >
            <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
            달력
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </section>
  )
}
