'use client'

import { Wallet, Bell, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Avatar } from 'radix-ui'
import { useAuthStore } from '@/app/store/useAuthStore'
import Image from 'next/image'
import { GHOST_IMAGES } from '@/app/constants/ghosts'

export default function Header() {
  const { user } = useAuthStore()

  const userProfile =
    GHOST_IMAGES.find((ghost) => ghost.id === user?.photoURL) || GHOST_IMAGES[0]

  if (!user) return null

  return (
    <header className="border-border bg-background/80 sticky top-0 z-50 w-full border-b backdrop-blur-md">
      <div className="base-layout flex h-16 items-center justify-between">
        <Link href={'/'} className="flex items-center gap-2">
          <Wallet className="text-accent h-6 w-6" />
          <span className="text-xl font-bold tracking-tight">
            내 돈 다 어디갔니?
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href={'/my'}
            className="bg-accent/20 border-accent/30 flex h-8 w-8 items-center justify-center rounded-full border"
          >
            {userProfile ? (
              <Image
                src={userProfile.src}
                alt="User Avatar"
                width={40}
                height={40}
                priority
                className="rounded-full"
              />
            ) : (
              <User className="text-accent h-4 w-4" />
            )}
          </Link>
        </div>
      </div>
    </header>
  )
}
