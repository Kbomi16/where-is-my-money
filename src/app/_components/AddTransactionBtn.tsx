'use client'

import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { AddTransactionModal } from './AddTransactionModal'

export function AddTransactionBtn() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <section className="flex justify-center">
      <Button
        size="lg"
        onClick={() => setIsOpen(!isOpen)}
        className="bg-accent hover:bg-accent/90 gap-2 rounded-full px-8 text-white shadow-lg transition-all hover:scale-105"
      >
        <Plus className="h-5 w-5" />
        내역 추가하기
      </Button>
      <AddTransactionModal open={isOpen} onOpenChange={setIsOpen} />
    </section>
  )
}
