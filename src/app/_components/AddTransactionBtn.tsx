'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { AddTransactionModal } from './AddTransactionModal'

export function AddTransactionBtn() {
  const [open, setOpen] = useState(false)
  const [defaultType, setDefaultType] = useState<'income' | 'expense'>(
    'expense',
  )

  const openAs = (type: 'income' | 'expense') => {
    setDefaultType(type)
    setOpen(true)
  }

  return (
    <>
      <section className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => openAs('income')}
          className="border-border bg-card text-foreground h-12 flex-[0.85] rounded-2xl text-sm font-bold shadow-none"
        >
          + 수입
        </Button>
        <Button
          type="button"
          onClick={() => openAs('expense')}
          className="h-12 flex-[1.35] rounded-2xl text-sm font-bold shadow-none"
        >
          + 지출 기록
        </Button>
      </section>
      {open && (
        <AddTransactionModal
          open={open}
          onOpenChange={setOpen}
          defaultType={defaultType}
        />
      )}
    </>
  )
}
