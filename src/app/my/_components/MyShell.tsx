'use client'

import type { ReactNode } from 'react'
import PageLayout from '@/components/common/PageLayout'
import { cn } from '@/lib/utils'

export default function MyShell({
  children,
  className,
  layoutClassName,
}: {
  children: ReactNode
  className?: string
  layoutClassName?: string
}) {
  return (
    <PageLayout className={cn('py-4 md:py-8', layoutClassName)}>
      <div className={cn('mx-auto flex w-full max-w-lg flex-col', className)}>
        {children}
      </div>
    </PageLayout>
  )
}
