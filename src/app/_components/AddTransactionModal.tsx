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
  Loader2,
} from 'lucide-react'

import { auth, db } from '@/lib/firebase'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'

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
import { CATEGORIES } from '../constants/categories'
import { toast } from 'sonner'

type FormData = {
  type: 'income' | 'expense' | null
  amount: number
  title: string
  date: Date
  category: string
  method?: 'check' | 'credit' | 'cash' | null
  memo?: string
}

export function AddTransactionModal({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState<FormData>({
    type: 'expense',
    amount: 0,
    title: '',
    date: new Date(),
    category: '',
    method: null,
    memo: '',
  })

  // ! formData 업데이트 핸들러
  const handleFieldChange = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
      // 타입(수입/지출)이 변경되면 카테고리를 초기화
      ...(field === 'type' && { category: '' }),
    }))
  }

  // ! 폼 제출
  const handleSubmit = async () => {
    // 1. 현재 로그인한 사용자 확인
    const currentUser = auth.currentUser

    if (!currentUser) {
      toast.error('로그인이 필요합니다!', {
        description: '기록을 저장하려면 먼저 로그인해주세요.',
      })
      return
    }

    // 필수값 검증 로직
    if (!formData.amount || Number(formData.amount) === 0) {
      toast.error('금액을 입력해주세요!')
      return
    }
    if (!formData.title.trim()) {
      toast.error('거래명을 입력해주세요!')
      return
    }
    if (!formData.category) {
      toast.error('카테고리를 선택해주세요!')
      return
    }
    if (formData.type === 'expense' && !formData.method) {
      toast.error('결제 수단을 선택해주세요!')
      return
    }

    setLoading(true)
    try {
      await addDoc(collection(db, 'transactions'), {
        ...formData,
        amount: Number(formData.amount),
        date: format(formData.date, 'yyyy-MM-dd'),
        userId: currentUser.uid, // 👈 본인의 데이터임을 식별하는 필드 추가
        createdAt: serverTimestamp(),
      })

      toast.success(
        `${formData.type === 'expense' ? '지출' : '수입'}이 추가되었어요!`,
        {
          description: `${formData.title} ${Number(formData.amount).toLocaleString()}원이 저장되었어요.`,
        },
      )

      // 폼 초기화
      setFormData({
        type: 'expense',
        amount: 0,
        title: '',
        date: new Date(),
        category: '',
        method: null,
        memo: '',
      })
      onOpenChange(false)
    } catch (error) {
      console.error('Error adding document: ', error)
      toast.error('저장에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setLoading(false)
    }
  }

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
            formData.type === 'expense'
              ? 'bg-red-50 dark:bg-red-950/20'
              : 'bg-emerald-50 dark:bg-emerald-950/20',
          )}
        >
          <DialogHeader className="mb-6">
            <DialogTitle className="flex items-center justify-center gap-2 text-xl font-black">
              {formData.type === 'expense' ? (
                <BanknoteArrowDown size={24} className="text-red-400" />
              ) : (
                <BanknoteArrowUp size={24} className="text-emerald-400" />
              )}
              <span className="text-slate-800 dark:text-slate-100">
                {formData.type === 'expense'
                  ? '어디에 쓰셨나요?'
                  : '얼마나 들어왔나요?'}
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
                value={formData.amount}
                onChange={(e) => handleFieldChange('amount', e.target.value)}
                className="h-12 w-full border-none bg-transparent text-center text-4xl font-black tracking-tighter text-slate-800 placeholder:text-slate-300 focus-visible:ring-0 dark:text-white"
              />
              <span className="text-lg font-bold text-slate-400">원</span>
            </div>
          </div>
        </div>

        <div className="relative -mt-6 rounded-t-4xl bg-white p-8 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] dark:bg-slate-950">
          <div className="space-y-5">
            <Tabs
              value={formData.type || 'expense'}
              className="w-full"
              onValueChange={(v) => handleFieldChange('type', v)}
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
                  value={formData.title}
                  onChange={(e) => handleFieldChange('title', e.target.value)}
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
                      {format(formData.date, 'MM/dd (eee)', { locale: ko })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="z-110 w-auto rounded-3xl border border-slate-100 bg-white p-0 shadow-2xl dark:bg-slate-900"
                    align="center"
                  >
                    <Calendar
                      mode="single"
                      selected={formData.date}
                      onSelect={(d) => d && handleFieldChange('date', d)}
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
                <Select
                  value={formData.category}
                  onValueChange={(v) => handleFieldChange('category', v)}
                >
                  <SelectTrigger className="h-12 w-full rounded-2xl border border-slate-100 bg-slate-50/50 px-4 font-bold dark:bg-slate-900">
                    <SelectValue placeholder="선택" />
                  </SelectTrigger>
                  <SelectContent className="z-110 rounded-2xl border border-slate-100 bg-white shadow-2xl dark:bg-slate-800">
                    {CATEGORIES[formData.type || 'expense'].map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.type === 'expense' && (
                <div className="space-y-2">
                  <Label className="ml-1 flex items-center gap-1.5 text-xs font-black tracking-wider text-slate-400 uppercase md:text-sm">
                    <CreditCard size={12} /> 결제수단
                  </Label>
                  <Select
                    value={formData.method || ''}
                    onValueChange={(v) => handleFieldChange('method', v)}
                  >
                    <SelectTrigger className="h-12 w-full rounded-2xl border border-slate-100 bg-slate-50/50 px-4 font-bold dark:bg-slate-900">
                      <SelectValue placeholder="선택" />
                    </SelectTrigger>
                    <SelectContent className="z-110 rounded-2xl border border-slate-100 bg-white shadow-2xl dark:bg-slate-800">
                      <SelectItem value="check">체크카드</SelectItem>
                      <SelectItem value="credit">신용카드</SelectItem>
                      <SelectItem value="cash">현금</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label className="ml-1 flex items-center gap-1.5 text-xs font-black tracking-wider text-slate-400 uppercase md:text-sm">
                <PencilLine size={12} /> 상세 메모
              </Label>
              <Textarea
                value={formData.memo}
                onChange={(e) => handleFieldChange('memo', e.target.value)}
                placeholder="예: 점심 식사, 친구와 함께"
                className="focus-visible:ring-accent min-h-24 resize-none rounded-3xl border border-slate-100 bg-slate-50/50 p-4 font-medium focus-visible:ring-1 dark:bg-slate-900"
              />
            </div>

            <Button
              onClick={handleSubmit}
              disabled={loading}
              className={cn(
                'h-16 w-full rounded-3xl text-lg font-black shadow-xl transition-all active:scale-95',
                formData.type === 'expense'
                  ? 'bg-accent hover:bg-accent/90'
                  : 'bg-emerald-500 shadow-emerald-200 hover:bg-emerald-600 dark:shadow-none',
              )}
            >
              {loading ? (
                <Loader2 className="animate-spin" />
              ) : formData.type === 'expense' ? (
                '지출 기록하기'
              ) : (
                '수입 저장하기'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
