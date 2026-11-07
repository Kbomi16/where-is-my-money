'use client'

import { useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'

type BackButtonProps = {
  href: string
  label: string
}

export default function BackButton({ href, label }: BackButtonProps) {
  const router = useRouter()

  const handleBack = () => {
    router.push(href)
  }

  return (
    <button
      type="button"
      aria-label={label}
      onClick={handleBack}
      className="border-border bg-card flex size-9 shrink-0 items-center justify-center rounded-xl border"
    >
      <ChevronLeft size={18} />
    </button>
  )
}
