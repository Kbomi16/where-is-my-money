'use client'

import { Megaphone } from 'lucide-react'
import Link from 'next/link'
import { useAuthStore } from '@/app/store/useAuthStore'

export default function Header() {
  const { user } = useAuthStore()

  if (!user) return null

  return (
    <header className="border-border bg-background/80 sticky top-0 z-50 w-full border-b backdrop-blur-md">
      <div className="base-layout flex h-14 items-center justify-between">
        <Link href="/" className="flex min-w-0 items-center gap-2.5">
          <img
            src="/imgs/logo.png"
            alt="내 돈 어디갔지"
            width={36}
            height={36}
            className="size-9 shrink-0 rounded-xl object-contain"
          />
          <span className="truncate text-[15px] font-bold tracking-tight">
            내 돈 어디갔지
          </span>
        </Link>
        <Link
          href="/notice"
          className="border-border bg-card flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-bold"
        >
          <Megaphone className="text-accent size-4" />
          공지
        </Link>
      </div>
    </header>
  )
}
