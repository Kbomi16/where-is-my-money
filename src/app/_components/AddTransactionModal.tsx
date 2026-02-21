'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import {
  CalendarIcon,
  Plus,
  CreditCard,
  PencilLine,
  BanknoteArrowDown,
  BanknoteArrowUp,
  Tag,
  Utensils,
} from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

const CATEGORIES = {
  expense: ['식비', '교통', '생활', '의료', '쇼핑', '기타'],
  income: ['월급', '부수입', '용돈', '금융수익', '기타'],
}

export function AddTransactionModal({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [type, setType] = useState<'income' | 'expense'>('expense')
  const [date, setDate] = useState<Date>(new Date())

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="bg-accent shadow-accent/40 hover:bg-accent/90 fixed right-6 bottom-6 z-50 h-14 w-14 rounded-full shadow-xl ring-4 ring-white transition-all hover:scale-110 active:scale-95 dark:ring-slate-950">
          <Plus className="h-8 w-8 text-white" />
        </Button>
      </DialogTrigger>

      <DialogContent className="w-full max-w-md gap-0 overflow-y-auto rounded-4xl border border-slate-100 bg-slate-50 p-0 shadow-2xl transition-all duration-300 max-sm:h-full max-sm:max-w-none max-sm:rounded-none dark:bg-slate-900">
        <div
          className={cn(
            'p-8 pb-10 transition-colors duration-500',
            type === 'expense'
              ? 'bg-red-50 dark:bg-red-950/20'
              : 'bg-emerald-50 dark:bg-emerald-950/20',
          )}
        >
          <DialogHeader className="mb-6">
            <DialogTitle className="flex items-center justify-center gap-2 text-xl font-black">
              {type === 'expense' ? (
                <BanknoteArrowDown size={24} className="text-red-400" />
              ) : (
                <BanknoteArrowUp size={24} className="text-emerald-400" />
              )}
              <span className="text-slate-800 dark:text-slate-100">
                {type === 'expense' ? '어디에 쓰셨나요?' : '얼마나 들어왔나요?'}
              </span>
            </DialogTitle>
          </DialogHeader>

          <div className="relative flex flex-col items-center">
            <div className="group relative flex w-full items-center justify-center gap-2">
              <Input
                type="number"
                placeholder="0"
                min={0}
                step={1000}
                className="h-12 w-full border border-slate-100 bg-transparent text-center text-4xl font-black tracking-tighter text-slate-800 placeholder:text-slate-300 focus-visible:ring-0 dark:text-white"
              />
              <span className="text-lg font-bold text-slate-400">원</span>
            </div>
          </div>
        </div>

        <div className="relative -mt-6 rounded-t-4xl bg-white p-8 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] dark:bg-slate-950">
          <div className="space-y-5">
            <Tabs
              value={type}
              className="w-full"
              onValueChange={(v) => setType(v as any)}
            >
              <TabsList className="grid h-12 w-full grid-cols-2 rounded-2xl bg-slate-100 p-1 dark:bg-slate-800">
                <TabsTrigger
                  value="expense"
                  className="cursor-pointer rounded-xl font-bold data-[state=active]:bg-white data-[state=active]:text-red-500 data-[state=active]:shadow-sm"
                >
                  지출
                </TabsTrigger>
                <TabsTrigger
                  value="income"
                  className="cursor-pointer rounded-xl font-bold data-[state=active]:bg-white data-[state=active]:text-emerald-500 data-[state=active]:shadow-sm"
                >
                  수입
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="ml-1 flex items-center gap-1.5 text-xs font-black tracking-wider text-slate-400 uppercase md:text-sm">
                  <Utensils size={12} /> 거래명
                </Label>
                <Input
                  placeholder="예: 스타벅스"
                  className="focus-visible:ring-accent h-12 rounded-2xl border border-slate-100 bg-slate-50/50 px-4 font-bold focus-visible:ring-1 dark:bg-slate-900"
                />
              </div>
              <div className="space-y-2">
                <Label className="ml-1 flex items-center gap-1.5 text-xs font-black tracking-wider text-slate-400 uppercase md:text-sm">
                  <CalendarIcon size={12} /> 날짜
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-12 w-full justify-start rounded-2xl border border-slate-100 bg-slate-50/50 px-4 font-bold dark:bg-slate-900"
                    >
                      {format(date, 'MM/dd (eee)', { locale: ko })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="z-110 ml-6 w-auto rounded-3xl border border-slate-100 bg-white p-0 shadow-2xl dark:bg-slate-900"
                    align="center"
                  >
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={(d) => d && setDate(d)}
                      locale={ko}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="ml-1 flex items-center gap-1.5 text-xs font-black tracking-wider text-slate-400 uppercase md:text-sm">
                  <Tag size={12} /> 카테고리
                </Label>
                <Select>
                  <SelectTrigger className="h-12 w-full rounded-2xl border border-slate-100 bg-slate-50/50 px-4 font-bold dark:bg-slate-900">
                    <SelectValue placeholder="선택" />
                  </SelectTrigger>
                  <SelectContent
                    position="popper"
                    className="z-110 rounded-2xl border border-slate-100 bg-white shadow-2xl dark:bg-slate-800"
                  >
                    {CATEGORIES[type].map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {type === 'expense' && (
                <div className="space-y-2">
                  <Label className="ml-1 flex items-center gap-1.5 text-xs font-black tracking-wider text-slate-400 uppercase md:text-sm">
                    <CreditCard size={12} /> 결제수단
                  </Label>
                  <Select defaultValue="check">
                    <SelectTrigger className="h-12 w-full rounded-2xl border border-slate-100 bg-slate-50/50 px-4 font-bold dark:bg-slate-900">
                      <SelectValue placeholder="선택" />
                    </SelectTrigger>
                    <SelectContent
                      position="popper"
                      className="z-110 rounded-2xl border border-slate-100 bg-white shadow-2xl dark:bg-slate-800"
                    >
                      <SelectItem value="check">체크카드</SelectItem>
                      <SelectItem value="credit">신용카드</SelectItem>
                      <SelectItem value="cash">현금</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* 메모 (Description) - 하단 전체 너비 */}
            <div className="space-y-2">
              <Label className="ml-1 flex items-center gap-1.5 text-xs font-black tracking-wider text-slate-400 uppercase md:text-sm">
                <PencilLine size={12} /> 상세 메모
              </Label>
              <Textarea
                placeholder="예: 점심 식사, 친구와 함께, 할인 쿠폰 사용"
                className="focus-visible:ring-accent min-h-24 resize-none rounded-3xl border border-slate-100 bg-slate-50/50 p-4 font-medium focus-visible:ring-1 dark:bg-slate-900"
              />
            </div>

            <Button
              className={cn(
                'h-16 w-full rounded-3xl text-lg font-black shadow-xl transition-all active:scale-95',
                type === 'expense'
                  ? 'bg-accent hover:bg-accent/90'
                  : 'bg-emerald-500 shadow-emerald-200 hover:bg-emerald-600 dark:shadow-none',
              )}
            >
              {type === 'expense' ? '지출 기록하기' : '수입 저장하기'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
