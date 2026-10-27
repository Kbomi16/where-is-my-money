'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AddTransactionModal } from '../_components/AddTransactionModal'

export default function RecordPage() {
  const router = useRouter()
  const [open, setOpen] = useState(true)

  return (
    <main className="base-layout py-6">
      <h1 className="text-lg font-bold">수입 · 지출 기록</h1>
      <p className="text-muted mt-1 text-sm">
        기록 창에서 수입이나 지출을 남겨요.
      </p>
      <AddTransactionModal
        open={open}
        onOpenChange={(next) => {
          setOpen(next)
          if (!next) router.push('/')
        }}
      />
    </main>
  )
}
