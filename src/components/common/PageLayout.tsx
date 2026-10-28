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
        'base-layout min-h-[calc(100vh-64px)] py-6 md:py-12',
        className,
      )}
    >
      {children}
    </main>
  )
}
