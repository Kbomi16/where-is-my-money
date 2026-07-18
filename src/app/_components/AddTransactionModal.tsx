'use client'

import { useEffect, useState } from 'react'
import { format, parseISO, addMonths } from 'date-fns'
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
  Check,
} from 'lucide-react'

import { auth, db } from '@/lib/firebase'
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore'

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
import { Transaction } from '../type/transaction.type'
import {
  getInstallmentDates,
  INSTALLMENT_MONTH_OPTIONS,
  splitInstallmentAmount,
} from '../utils/installment'

type FormData = {
  type: 'income' | 'expense' | null
  amount: number
  title: string
  date: Date
  category: string
  method?:
    | 'check'
    | 'credit'
    | 'cash'
    | 'bank'
    | 'kakaoPay'
    | 'naverPay'
    | 'applePay'
    | 'tossPay'
    | 'etc'
    | null
  memo?: string
  installmentMonths?: number
  isExclude?: boolean
}

type AddTransactionModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingItem?: Transaction | null
}

const methods: Record<string, string> = {
  check: '체크카드',
  credit: '신용카드',
  cash: '현금',
  bank: '계좌',
  kakaoPay: '카카오페이',
  naverPay: '네이버페이',
  applePay: '애플페이',
  tossPay: '토스페이',
  etc: '기타',
}

export function AddTransactionModal({
  open,
  onOpenChange,
  editingItem = null,
}: AddTransactionModalProps) {
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState<FormData>({
    type: 'expense',
    amount: 0,
    title: '',
    date: new Date(),
    category: '',
    method: null,
    memo: '',
    installmentMonths: 1,
  })

  useEffect(() => {
    if (editingItem) {
      setFormData({
        type: editingItem.type,
        amount: editingItem.amount,
        title: editingItem.title,
        // string 형태의 date를 Date 객체로 변환
        date: parseISO(editingItem.date),
        category: editingItem.category,
        method: editingItem.method || null,
        memo: editingItem.memo || '',
        installmentMonths: editingItem.installmentTotal || 1,
        isExclude: editingItem.isExclude || false,
      })
    } else {
      setFormData({
        type: 'expense',
        amount: 0,
        title: '',
        date: new Date(),
        category: '',
        method: null,
        memo: '',
        installmentMonths: 1,
        isExclude: false,
      })
    }
  }, [editingItem, open])

  // ! formData 업데이트 핸들러
  const handleFieldChange = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
      ...(field === 'type' && { category: '' }),
      ...(field === 'method' && value !== 'credit' && { installmentMonths: 1 }),
    }))
  }

  const isCreditInstallment =
    formData.type === 'expense' &&
    formData.method === 'credit' &&
    !editingItem &&
    (formData.installmentMonths || 1) > 1

  const installmentAmounts =
    isCreditInstallment && formData.amount
      ? splitInstallmentAmount(
          Number(formData.amount),
          formData.installmentMonths || 1,
        )
      : []

  const installmentPreviewText =
    isCreditInstallment && installmentAmounts.length > 0
      ? (() => {
          const months = formData.installmentMonths || 1
          const monthlyAmount = installmentAmounts[0]
          const lastAmount = installmentAmounts[months - 1]
          const startMonth = format(formData.date, 'M월', { locale: ko })
          const endMonth = format(addMonths(formData.date, months - 1), 'M월', {
            locale: ko,
          })

          if (monthlyAmount === lastAmount) {
            return `${startMonth}부터 ${endMonth}까지 매월 ${monthlyAmount.toLocaleString()}원씩 등록돼요.`
          }

          return `${startMonth}부터 ${endMonth}까지 ${months - 1}개월은 ${monthlyAmount.toLocaleString()}원, 마지막 달은 ${lastAmount.toLocaleString()}원이 등록돼요.`
        })()
      : null

  // ! 폼 제출
  const handleSubmit = async () => {
    // 1. 현재 로그인한 사용자 확인
    const currentUser = auth.currentUser

    if (!currentUser) {
      toast.error('로그인이 필요헤요!', {
        description: '기록을 저장하려면 먼저 로그인해주세요.',
      })
      return
    }

    // 2. 필수값 검증 로직
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
      const totalAmount = Number(formData.amount)
      const installmentMonths =
        formData.type === 'expense' &&
        formData.method === 'credit' &&
        !editingItem
          ? formData.installmentMonths || 1
          : 1

      const basePayload = {
        type: formData.type,
        title: formData.title,
        category: formData.category,
        method: formData.type === 'expense' ? formData.method : null,
        memo: formData.memo || '',
        isExclude: formData.isExclude || false,
        userId: currentUser.uid,
        updatedAt: serverTimestamp(),
      }

      if (editingItem) {
        const docRef = doc(db, 'transactions', editingItem.id)
        await updateDoc(docRef, {
          ...basePayload,
          amount: totalAmount,
          date: format(formData.date, 'yyyy-MM-dd'),
        })

        toast.success('내역이 수정되었습니다! ✨')
      } else if (installmentMonths > 1) {
        const amounts = splitInstallmentAmount(totalAmount, installmentMonths)
        const dates = getInstallmentDates(formData.date, installmentMonths)
        const groupId = crypto.randomUUID()
        const batch = writeBatch(db)

        amounts.forEach((amount, index) => {
          const docRef = doc(collection(db, 'transactions'))
          batch.set(docRef, {
            ...basePayload,
            amount,
            date: dates[index],
            createdAt: serverTimestamp(),
            installmentTotal: installmentMonths,
            installmentIndex: index + 1,
            installmentGroupId: groupId,
          })
        })

        await batch.commit()

        toast.success('할부 지출이 등록되었어요!', {
          description: `${formData.title} ${totalAmount.toLocaleString()}원을 ${installmentMonths}개월에 나눠 저장했어요.`,
        })
      } else {
        await addDoc(collection(db, 'transactions'), {
          ...basePayload,
          amount: totalAmount,
          date: format(formData.date, 'yyyy-MM-dd'),
          createdAt: serverTimestamp(),
        })

        toast.success(
          `${formData.type === 'expense' ? '지출' : '수입'}이 추가되었어요!`,
          {
            description: `${formData.title} ${totalAmount.toLocaleString()}원이 저장되었어요.`,
          },
        )
      }

      setFormData({
        type: 'expense',
        amount: 0,
        title: '',
        date: new Date(),
        category: '',
        method: null,
        memo: '',
        installmentMonths: 1,
      })
      onOpenChange(false)
    } catch (error) {
      console.error('Error saving document: ', error)
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

      {/* 
        모바일: max-sm:h-full로 전체 화면을 채우고, 모달 전체가 위아래로 스크롤 (overflow-y-auto)
        PC(sm 이상): 높이를 최대 85vh로 고정하고, 내부 구조를 flex-col로 배치 (sm:max-h-[85vh] sm:overflow-hidden)
      */}
      <DialogContent className="w-full max-w-md gap-0 rounded-4xl border border-slate-100 bg-white p-0 shadow-2xl transition-all duration-300 max-sm:h-full max-sm:max-w-none max-sm:overflow-y-auto max-sm:rounded-none sm:flex sm:max-h-[85vh] sm:flex-col sm:overflow-hidden dark:border-slate-800 dark:bg-slate-950">
        {/* 금액 입력 영역 (PC에서는 고정 / 모바일에서는 상단에 자연스럽게 위치) */}
        <div
          className={cn(
            'rounded-t-4xl p-8 pb-10 transition-colors duration-500 max-sm:rounded-none sm:shrink-0',
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
                min={0}
                step={1000}
                value={formData.amount}
                onChange={(e) => handleFieldChange('amount', e.target.value)}
                className="h-12 w-full border-none bg-transparent text-center text-4xl! font-black tracking-tighter text-slate-800 placeholder:text-slate-300 focus-visible:ring-0 dark:text-white"
              />
              <span className="text-lg font-bold text-slate-400">원</span>
            </div>
          </div>
        </div>

        {/* 
          상세 입력 폼 영역 
          모바일: 기존 느낌 그대로 마이너스 마진(-mt-6) 유지하며 자연스럽게 흐름
          PC(sm 이상): 겹침을 해제하고 이 영역 내부에서만 독립 스크롤이 되도록 구성 (sm:flex-1 sm:overflow-y-auto sm:mt-0)
        */}
        <div className="relative -mt-6 rounded-t-4xl bg-white p-8 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] sm:mt-0 sm:flex-1 sm:overflow-y-auto sm:rounded-none sm:shadow-none dark:bg-slate-950">
          <div className="space-y-5 pb-2">
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
                  className="focus-visible:ring-accent h-12 rounded-2xl border border-slate-100 bg-slate-50/50 px-4 font-bold focus-visible:ring-1 dark:border-slate-800 dark:bg-slate-900"
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
                      className="h-12 w-full justify-start rounded-2xl border border-slate-100 bg-slate-50/50 px-4 font-bold dark:border-slate-800 dark:bg-slate-900"
                    >
                      {format(formData.date, 'MM/dd (eee)', { locale: ko })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="z-110 w-auto rounded-3xl border border-slate-100 bg-white p-0 shadow-2xl dark:border-slate-800 dark:bg-slate-900"
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
                  <SelectTrigger className="h-12 w-full rounded-2xl border border-slate-100 bg-slate-50/50 px-4 font-bold dark:border-slate-800 dark:bg-slate-900">
                    <SelectValue placeholder="선택" />
                  </SelectTrigger>
                  <SelectContent
                    position="popper"
                    className="z-110 rounded-2xl border border-slate-100 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900"
                  >
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
                    <SelectTrigger className="h-12 w-full rounded-2xl border border-slate-100 bg-slate-50/50 px-4 font-bold dark:border-slate-800 dark:bg-slate-900">
                      <SelectValue placeholder="선택" />
                    </SelectTrigger>
                    <SelectContent
                      position="popper"
                      className="z-110 rounded-2xl border border-slate-100 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900"
                    >
                      {Object.entries(methods).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {formData.type === 'expense' &&
              formData.method === 'credit' &&
              !editingItem && (
                <div className="space-y-2">
                  <Label className="ml-1 flex items-center gap-1.5 text-xs font-black tracking-wider text-slate-400 uppercase md:text-sm">
                    <CreditCard size={12} /> 할부 개월
                  </Label>
                  <Select
                    value={String(formData.installmentMonths || 1)}
                    onValueChange={(v) =>
                      handleFieldChange('installmentMonths', Number(v))
                    }
                  >
                    <SelectTrigger className="h-12 w-full rounded-2xl border border-slate-100 bg-slate-50/50 px-4 font-bold dark:border-slate-800 dark:bg-slate-900">
                      <SelectValue placeholder="일시불" />
                    </SelectTrigger>
                    <SelectContent
                      position="popper"
                      className="z-110 rounded-2xl border border-slate-100 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900"
                    >
                      {INSTALLMENT_MONTH_OPTIONS.map((month) => (
                        <SelectItem key={month} value={String(month)}>
                          {month === 1 ? '일시불' : `${month}개월`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {installmentPreviewText && (
                    <p className="px-1 text-[11px] leading-relaxed font-medium text-purple-500">
                      {installmentPreviewText}
                    </p>
                  )}
                </div>
              )}

            {editingItem?.installmentTotal &&
              editingItem.installmentTotal > 1 && (
                <p className="rounded-2xl bg-purple-50 px-4 py-3 text-xs font-medium text-purple-600 dark:bg-purple-950/30 dark:text-purple-300">
                  {editingItem.installmentTotal}개월 할부{' '}
                  {editingItem.installmentIndex}회차 내역이에요. 금액 수정 시 이
                  회차만 변경돼요.
                </p>
              )}

            <div className="space-y-2">
              <Label className="ml-1 flex items-center gap-1.5 text-xs font-black tracking-wider text-slate-400 uppercase md:text-sm">
                <PencilLine size={12} /> 상세 메모
              </Label>
              <Textarea
                value={formData.memo}
                onChange={(e) => handleFieldChange('memo', e.target.value)}
                placeholder="예: 점심 식사, 친구와 함께"
                className="focus-visible:ring-accent min-h-24 resize-none rounded-3xl border border-slate-100 bg-slate-50/50 p-4 font-medium focus-visible:ring-1 dark:border-slate-800 dark:bg-slate-900"
              />
            </div>

            <div
              onClick={() =>
                handleFieldChange('isExclude', !formData.isExclude)
              }
              className={cn(
                'group flex cursor-pointer items-center justify-between rounded-2xl border-2 p-4 transition-all duration-200 select-none',
                formData.isExclude
                  ? 'border-slate-400 bg-slate-50 dark:bg-slate-800/50'
                  : 'border-transparent bg-slate-50/50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800',
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all',
                    formData.isExclude
                      ? 'border-slate-600 bg-slate-600 text-white'
                      : 'border-slate-300 bg-white dark:bg-slate-800',
                  )}
                >
                  {formData.isExclude && <Check size={14} strokeWidth={4} />}
                </div>
                <div className="flex flex-col">
                  <span
                    className={cn(
                      'text-sm font-bold transition-colors',
                      formData.isExclude
                        ? 'text-slate-700 dark:text-slate-200'
                        : 'text-slate-500',
                    )}
                  >
                    통계에서 제외하기
                  </span>
                  <span className="text-[11px] font-medium text-slate-400">
                    이 내역은 월별 분석 결과에 포함되지 않아요.
                  </span>
                </div>
              </div>

              <div
                className={cn(
                  'relative h-5 w-9 rounded-full transition-colors duration-200',
                  formData.isExclude
                    ? 'bg-slate-600'
                    : 'bg-slate-200 dark:bg-slate-700',
                )}
              >
                <div
                  className={cn(
                    'absolute top-1 h-3 w-3 rounded-full bg-white transition-all duration-200',
                    formData.isExclude ? 'left-5' : 'left-1',
                  )}
                />
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={loading}
              className={cn(
                'mt-2 h-16 w-full rounded-3xl text-lg font-black shadow-xl transition-all active:scale-95',
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
