'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { Plus } from 'lucide-react'
import { useAuthStore } from '@/app/store/useAuthStore'
import { AddTransactionModal } from '@/app/_components/AddTransactionModal'
import { Button } from '@/components/ui/button'

export default function AddTransactionFab() {
  const [open, setOpen] = useState(false)

  const { user } = useAuthStore()
  const pathname = usePathname()

  const handleOpen = () => {
    setOpen(true)
  }

  if (!user) return null
  if (pathname === '/login' || pathname === '/signup') return null

  return (
    <>
      <Button
        type="button"
        onClick={handleOpen}
        aria-label="수입지출 기록"
        className="bg-accent shadow-accent/40 hover:bg-accent/90 fixed right-6 bottom-24 z-50 h-14 w-14 rounded-full shadow-xl ring-4 ring-white dark:ring-slate-950"
      >
        <Plus className="h-8 w-8 text-white" />
      </Button>
      <AddTransactionModal open={open} onOpenChange={setOpen} />
    </>
  )
}
