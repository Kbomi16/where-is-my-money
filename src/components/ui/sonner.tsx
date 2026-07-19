'use client'

import type { CSSProperties, ReactNode } from 'react'
import { useTheme } from 'next-themes'
import { Toaster as Sonner, type ToasterProps } from 'sonner'
import { Check, Info, Loader2, X } from 'lucide-react'
import { cn } from '@/lib/utils'

type ToastIconVariant = 'success' | 'info' | 'warning' | 'error' | 'loading'

function ToastStatusIcon({
  variant,
  children,
}: {
  variant: ToastIconVariant
  children: ReactNode
}) {
  const variantStyles: Record<ToastIconVariant, string> = {
    success: 'bg-[#1677ff]',
    info: 'bg-blue-600',
    warning: 'bg-[#F5C518]',
    error: 'bg-red-500',
    loading: 'bg-slate-700 text-white dark:bg-slate-600',
  }

  const iconColorClass =
    variant === 'loading'
      ? 'text-white [&_svg]:text-white'
      : 'text-white [&_svg]:text-white'

  return (
    <span
      className={cn(
        'toast-status-icon inline-flex size-7 shrink-0 items-center justify-center rounded-full leading-none',
        '[&_svg]:block [&_svg]:size-3.5 [&_svg]:shrink-0 [&_svg]:text-current',
        iconColorClass,
        variantStyles[variant],
      )}
    >
      {children}
    </span>
  )
}

const sonnerStyles = `
  :root {
    --sonner-toast-bg: #ffffff;
    --sonner-toast-text: #111827;
    --sonner-toast-text-muted: #687280;
    --sonner-toast-border: #e5e7eb;
    --sonner-toast-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.06);
  }

  .dark {
    --sonner-toast-bg: #3b424e;
    --sonner-toast-text: #ffffff;
    --sonner-toast-text-muted: rgba(255, 255, 255, 0.7);
    --sonner-toast-border: rgba(255, 255, 255, 0.1);
    --sonner-toast-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.25), 0 4px 6px -4px rgb(0 0 0 / 0.15);
  }

  [data-sonner-toaster] [data-sonner-toast] {
    overflow-wrap: normal;
    word-break: keep-all;
    align-items: center !important;
    gap: 12px !important;
    background: var(--sonner-toast-bg) !important;
    border-color: var(--sonner-toast-border) !important;
    color: var(--sonner-toast-text) !important;
    border-radius: 1rem !important;
    box-shadow: var(--sonner-toast-shadow) !important;
  }

  [data-sonner-toaster] [data-sonner-toast] [data-icon] {
    position: relative;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    width: 1.75rem !important;
    height: 1.75rem !important;
    margin: 0 !important;
    flex-shrink: 0;
    align-self: center !important;
    line-height: 0;
    color: inherit !important;
  }

  [data-sonner-toast][data-styled='true'] [data-icon] {
    justify-content: center !important;
    align-items: center !important;
  }

  [data-sonner-toaster] [data-sonner-toast] [data-icon] > * {
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    margin: 0 !important;
    width: 100%;
    height: 100%;
  }

  [data-sonner-toaster] [data-sonner-toast] [data-icon] svg {
    margin: 0 !important;
    display: block !important;
    width: 0.875rem !important;
    height: 0.875rem !important;
    color: inherit !important;
  }

  [data-sonner-toaster] [data-sonner-toast] .toast-status-icon {
    line-height: 0;
  }

  [data-sonner-toaster] [data-sonner-toast] .toast-status-icon svg {
    margin: 0 !important;
    display: block !important;
  }

  [data-sonner-toaster] [data-sonner-toast] .sonner-loader {
    position: static !important;
    top: auto !important;
    left: auto !important;
    transform: none !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    width: 1.75rem !important;
    height: 1.75rem !important;
    flex-shrink: 0;
  }

  [data-sonner-toaster] [data-sonner-toast] .sonner-loader[data-visible='false'] {
    transform: none !important;
    opacity: 0;
  }

  [data-sonner-toaster] [data-sonner-toast] .sonner-loading-wrapper {
    display: none !important;
  }

  [data-sonner-toaster] [data-sonner-toast] [data-content] {
    display: flex;
    flex-direction: column;
    justify-content: center;
    flex: 1;
    min-width: 0;
  }

  [data-sonner-toaster] [data-sonner-toast][data-type='loading'] {
    align-items: center !important;
  }

  [data-sonner-toaster] [data-sonner-toast][data-type='loading'] [data-icon] {
    margin-top: 0 !important;
  }

  [data-sonner-toaster] [data-sonner-toast] [data-title] {
    color: var(--sonner-toast-text) !important;
    font-size: 0.875rem;
    line-height: 1.375;
    font-weight: 500;
  }

  [data-sonner-toaster] [data-sonner-toast] [data-description] {
    color: var(--sonner-toast-text-muted) !important;
    font-size: 0.875rem;
    line-height: 1.375;
  }

  [data-sonner-toaster] [data-sonner-toast]:has([data-description]) {
    align-items: flex-start !important;
  }

  [data-sonner-toaster] [data-sonner-toast]:has([data-description]) [data-icon] {
    margin-top: 2px !important;
    width: 2.25rem !important;
    height: 2.25rem !important;
  }

  [data-sonner-toaster] [data-sonner-toast]:has([data-description]) .toast-status-icon {
    width: 2.25rem;
    height: 2.25rem;
  }

  [data-sonner-toaster] [data-sonner-toast]:has([data-description]) .toast-status-icon svg {
    width: 1.125rem;
    height: 1.125rem;
  }
`

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme()

  return (
    <>
      <style>{sonnerStyles}</style>
      <Sonner
        theme={theme as ToasterProps['theme']}
        richColors={false}
        className="toaster group"
        icons={{
          success: (
            <ToastStatusIcon variant="success">
              <Check strokeWidth={3} />
            </ToastStatusIcon>
          ),
          info: (
            <ToastStatusIcon variant="info">
              <Info strokeWidth={2.5} />
            </ToastStatusIcon>
          ),
          warning: (
            <ToastStatusIcon variant="warning">
              <span className="flex size-full items-center justify-center text-[13px] leading-none font-bold">
                !
              </span>
            </ToastStatusIcon>
          ),
          error: (
            <ToastStatusIcon variant="error">
              <X strokeWidth={3} />
            </ToastStatusIcon>
          ),
          loading: (
            <ToastStatusIcon variant="loading">
              <Loader2 className="animate-spin" />
            </ToastStatusIcon>
          ),
        }}
        style={
          {
            '--normal-bg': 'var(--sonner-toast-bg)',
            '--normal-text': 'var(--sonner-toast-text)',
            '--normal-border': 'var(--sonner-toast-border)',
            '--border-radius': '1rem',
          } as CSSProperties
        }
        toastOptions={{
          classNames: {
            toast: 'rounded-2xl border',
            icon: 'flex shrink-0 items-center justify-center self-center',
            loader:
              'static flex size-7 shrink-0 items-center justify-center translate-none transform-none',
            actionButton:
              'border-border bg-muted text-foreground hover:bg-accent',
            cancelButton:
              'border-border bg-muted text-foreground hover:bg-accent',
            closeButton:
              'border-border bg-muted text-foreground hover:bg-accent',
          },
        }}
        {...props}
      />
    </>
  )
}

export { Toaster }
