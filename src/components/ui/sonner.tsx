'use client'

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { Toaster as Sonner, type ToasterProps } from 'sonner'

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4 text-sky-400" />,
        info: <InfoIcon className="size-4 text-emerald-400" />,
        warning: <TriangleAlertIcon className="size-4 text-amber-400" />,
        error: <OctagonXIcon className="size-4 text-rose-400" />,
        loading: (
          <Loader2Icon className="size-4 animate-spin text-indigo-300" />
        ),
      }}
      toastOptions={{
        className: `
          !backdrop-blur-md 
          !shadow-2xl 
          !font-bold 
          data-[type=error]:!bg-[var(--error-bg)] 
          data-[type=error]:!text-[var(--error-text)] 
          data-[type=error]:!border-[var(--error-border)]
          data-[type=success]:!bg-[var(--success-bg)] 
          data-[type=success]:!text-[var(--success-text)] 
          data-[type=success]:!border-[var(--success-border)]
          data-[type=warning]:!bg-[var(--warning-bg)] 
          data-[type=warning]:!text-[var(--warning-text)] 
          data-[type=warning]:!border-[var(--warning-border)]
          data-[type=info]:!bg-[var(--info-bg)] 
          data-[type=info]:!text-[var(--info-text)] 
          data-[type=info]:!border-[var(--info-border)]
        `,
        descriptionClassName: `
          !opacity-90
          data-[type=error]:!text-[var(--error-text)] 
          data-[type=success]:!text-[var(--success-text)] 
          data-[type=warning]:!text-[var(--warning-text)] 
          data-[type=info]:!text-[var(--info-text)] 
        `,
      }}
      style={
        {
          '--success-bg': 'rgba(22, 119, 255, 0.1)',
          '--success-text': '#1677ff',
          '--success-border': 'rgba(22, 119, 255, 0.3)',

          '--error-bg': 'rgba(244, 63, 94, 0.1)',
          '--error-text': '#fb7185',
          '--error-border': 'rgba(244, 63, 94, 0.35)',

          '--warning-bg': 'rgba(245, 158, 11, 0.1)',
          '--warning-text': '#fbbf24',
          '--warning-border': 'rgba(245, 158, 11, 0.35)',

          '--info-bg': 'rgba(16, 185, 129, 0.1)',
          '--info-text': '#34d399',
          '--info-border': 'rgba(16, 185, 129, 0.35)',

          '--border-radius': '1rem',
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
