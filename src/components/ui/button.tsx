import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { Slot } from 'radix-ui'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'cursor-pointer inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 active:scale-95 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-accent/50',
  {
    variants: {
      variant: {
        // 메인 컬러(Accent) 사용
        default:
          'bg-accent text-white shadow-[0_4px_14px_0_rgba(52,152,219,0.39)] hover:bg-accent/90 hover:shadow-[0_6px_20px_rgba(52,152,219,0.23)]',
        // 지출/삭제용
        destructive:
          'bg-expense text-white shadow-[0_4px_14px_0_rgba(231,76,60,0.39)] hover:bg-expense/90',
        // 수입용 (새로 추가)
        income:
          'bg-income text-white shadow-[0_4px_14px_0_rgba(39,174,96,0.39)] hover:bg-income/90',
        // 테두리 버전: 더 깔끔하고 얇게
        outline:
          'border border-border bg-background hover:bg-accent/5 hover:text-accent hover:border-accent/30',
        secondary: 'bg-muted/10 text-foreground hover:bg-muted/20',
        ghost: 'hover:bg-accent/10 hover:text-accent',
        link: 'text-accent underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-11 px-6 py-2', // 조금 더 시원시원한 높이
        xs: 'h-7 px-2 text-xs',
        sm: 'h-9 px-4 text-xs',
        lg: 'h-13 px-10 text-base rounded-2xl', // 강조 버튼용
        icon: 'size-11 rounded-full', // 아이콘 버튼은 동그랗게
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Button({
  className,
  variant = 'default',
  size = 'default',
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : 'button'

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
