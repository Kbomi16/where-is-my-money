import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type PageLayoutProps = {
  children: ReactNode
  className?: string
}

export default function PageLayout({ children, className }: PageLayoutProps) {
  return (
    <main
      className={cn(
        'base-layout min-h-[calc(100vh-64px)] pt-3 pb-2 md:py-8',
        className,
      )}
    >
      {children}
    </main>
  )
}
