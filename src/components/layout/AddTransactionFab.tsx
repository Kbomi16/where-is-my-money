'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { useAuthStore } from '@/app/store/useAuthStore'
import { AddTransactionModal } from '@/app/_components/AddTransactionModal'

export default function AddTransactionFab() {
  const { user } = useAuthStore()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  if (!user) return null
  if (pathname === '/login' || pathname === '/signup') return null

  return <AddTransactionModal open={open} onOpenChange={setOpen} />
}
