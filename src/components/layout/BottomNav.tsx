'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, User } from 'lucide-react'
import { useAuthStore } from '@/app/store/useAuthStore'
import { cn } from '@/lib/utils'

const tabs = [
  {
    href: '/',
    label: '홈',
    icon: Home,
    isActive: (pathname: string) => pathname === '/',
  },
  {
    href: '/my',
    label: '마이',
    icon: User,
    isActive: (pathname: string) => pathname.startsWith('/my'),
  },
]

export default function BottomNav() {
  const { user } = useAuthStore()
  const pathname = usePathname()

  if (!user) return null
  if (pathname === '/login' || pathname === '/signup') return null

  return (
    <nav
      aria-label="하단 메뉴"
      className="border-border bg-card fixed inset-x-0 bottom-0 z-50 border-t pb-[env(safe-area-inset-bottom)]"
    >
      <div className="mx-auto grid h-16 max-w-lg grid-cols-2">
        {tabs.map((tab) => {
          const active = tab.isActive(pathname)
          const Icon = tab.icon
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex flex-col items-center justify-center gap-1 text-xs font-semibold',
                active ? 'text-accent' : 'text-muted',
              )}
            >
              <span
                className={cn(
                  'flex size-7 items-center justify-center rounded-[10px]',
                  active && 'bg-accent/10',
                )}
              >
                <Icon size={18} strokeWidth={2.25} />
              </span>
              {tab.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
