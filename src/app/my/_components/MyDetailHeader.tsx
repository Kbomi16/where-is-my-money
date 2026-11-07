import type { ReactNode } from 'react'
import BackButton from '@/components/common/BackButton'

export default function MyDetailHeader({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <header>
      <div className="mb-2 flex items-center justify-between gap-2">
        <BackButton href="/my" label="마이로 돌아가기" />
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
