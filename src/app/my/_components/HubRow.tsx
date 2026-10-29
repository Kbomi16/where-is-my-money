'use client'

import type { LucideIcon } from 'lucide-react'
import { ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

const tones = {
  blue: 'bg-accent/10 text-accent',
  green: 'bg-income/15 text-income',
  amber: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  violet:
    'bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300',
  rose: 'bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300',
} as const

export type HubTone = keyof typeof tones

type RowContent = {
  icon: LucideIcon
  tone: HubTone
  title: string
  description: string
  pill?: string
}

const rowClass =
  'hover:bg-accent/5 focus-visible:bg-accent/10 flex w-full items-center gap-3 px-3.5 py-2.5 text-left transition-colors outline-none'

function RowBody({ icon: Icon, tone, title, description, pill }: RowContent) {
  return (
    <>
      <span
        className={cn(
          'flex size-10 shrink-0 items-center justify-center rounded-xl',
          tones[tone],
        )}
      >
        <Icon size={18} strokeWidth={2.25} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-extrabold tracking-tight">
          {title}
        </span>
        <span className="text-muted mt-0.5 block truncate text-[11px] font-medium">
          {description}
        </span>
      </span>
      {pill ? (
        <span className="bg-accent/10 text-accent shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold">
          {pill}
        </span>
      ) : null}
      <ChevronRight className="text-muted size-4 shrink-0" />
    </>
  )
}

export function HubRow({
  href,
  ...content
}: RowContent & {
  href: string
}) {
  return (
    <Link href={href} className={rowClass}>
      <RowBody {...content} />
    </Link>
  )
}

export function HubAction({
  onClick,
  ...content
}: RowContent & {
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(rowClass, 'cursor-pointer')}
    >
      <RowBody {...content} />
    </button>
  )
}
