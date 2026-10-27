'use client'

import { Megaphone } from 'lucide-react'
import Link from 'next/link'
import { useAuthStore } from '@/app/store/useAuthStore'
import Image from 'next/image'

export default function Header() {
  const { user } = useAuthStore()

  if (!user) return null

  return (
    <header className="border-border bg-background/80 sticky top-0 z-50 w-full border-b backdrop-blur-md">
      <div className="base-layout flex h-14 items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <Image
            src="/imgs/logo.png"
            alt=""
            width={36}
            height={36}
            priority
            className="size-9 rounded-xl"
          />
          <span className="text-[15px] font-bold tracking-tight">
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
