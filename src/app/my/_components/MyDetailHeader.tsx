'use client'

import type { ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'

export default function MyDetailHeader({
  title,
  action,
}: {
  title: string
  action?: ReactNode
}) {
  const router = useRouter()

  return (
    <div className="mb-3 flex items-center gap-2">
      <button
        type="button"
        aria-label="마이로 돌아가기"
        onClick={() => router.push('/my')}
        className="border-border bg-card flex size-9 shrink-0 items-center justify-center rounded-xl border"
      >
        <ChevronLeft size={18} />
      </button>
      <h1 className="min-w-0 flex-1 truncate text-[17px] font-extrabold tracking-tight">
        {title}
      </h1>
      {action}
    </div>
  )
}
