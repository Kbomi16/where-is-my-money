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
    <PageLayout className={layoutClassName}>
      <div
        className={cn(
          'mx-auto flex w-full max-w-lg flex-col md:max-w-3xl',
          className,
        )}
      >
        {children}
      </div>
    </PageLayout>
  )
}
