'use client'

import { Wallet, Bell, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Avatar } from 'radix-ui'
import { useAuthStore } from '@/app/store/useAuthStore'

export default function Header() {
  const { user } = useAuthStore()

  if (!user) return null

  return (
    <header className="border-border bg-background/80 sticky top-0 z-50 w-full border-b backdrop-blur-md">
      <div className="base-layout flex h-16 items-center justify-between">
        <Link href={'/'} className="flex items-center gap-2">
          <Wallet className="text-accent h-6 w-6" />
          <span className="text-xl font-bold tracking-tight">
            Where did it go?
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href={'/my'}
            className="bg-accent/20 border-accent/30 flex h-8 w-8 items-center justify-center rounded-full border"
          >
            <User className="size-5" />
          </Link>
        </div>
      </div>
    </header>
  )
}
