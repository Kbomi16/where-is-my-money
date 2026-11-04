'use client'

import type { ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'

export default function MyDetailHeader({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action?: ReactNode
}) {
  const router = useRouter()

  return (
    <header>
      <div className="mb-2 flex items-center justify-between gap-2">
        <button
          type="button"
          aria-label="마이로 돌아가기"
          onClick={() => router.push('/my')}
          className="border-border bg-card flex size-9 shrink-0 items-center justify-center rounded-xl border"
        >
          <ChevronLeft size={18} />
        </button>
        {action}
      </div>
      <h1 className="text-[22px] font-extrabold tracking-tight md:text-[28px]">
        {title}
      </h1>
      <p className="text-muted mt-0.5 mb-3 text-[13px] font-semibold md:mb-5 md:text-sm">
        {description}
      </p>
    </header>
  )
}
