'use client'

import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function AddTransactionBtn() {
  return (
    <section className="flex justify-center">
      <Button
        size="lg"
        onClick={() => alert('내역 추가 모달을 엽니다!')}
        className="bg-accent hover:bg-accent/90 gap-2 rounded-full px-8 text-white shadow-lg transition-all hover:scale-105"
      >
        <Plus className="h-5 w-5" />
        내역 추가하기
      </Button>
    </section>
  )
}
