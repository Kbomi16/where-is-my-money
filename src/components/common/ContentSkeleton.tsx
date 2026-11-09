import { Skeleton } from '@/components/ui/skeleton'

function LoadingLabel() {
  return <span className="sr-only">불러오는 중</span>
}

export function PageSkeleton() {
  return (
    <div
      className="base-layout min-h-[calc(100vh-64px)] pt-3 pb-2 md:py-8"
      aria-busy="true"
    >
      <LoadingLabel />
      <Skeleton className="h-7 w-24 md:h-8" />
      <Skeleton className="mt-2 mb-5 h-4 w-48" />
      <Skeleton className="h-14 w-full rounded-2xl" />
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] md:gap-6">
        <Skeleton className="h-72 rounded-[28px]" />
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-2">
            <Skeleton className="h-20 rounded-2xl" />
            <Skeleton className="h-20 rounded-2xl" />
          </div>
          <Skeleton className="h-56 rounded-[28px]" />
        </div>
      </div>
    </div>
  )
}

export function AuthFormSkeleton() {
  return (
    <div
      className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4"
      aria-busy="true"
    >
      <LoadingLabel />
      <div className="border-border bg-card w-full max-w-md space-y-4 rounded-3xl border p-6">
        <Skeleton className="mx-auto size-14 rounded-2xl" />
        <Skeleton className="mx-auto h-6 w-36" />
        <Skeleton className="h-11 w-full rounded-xl" />
        <Skeleton className="h-11 w-full rounded-xl" />
        <Skeleton className="h-11 w-full rounded-xl" />
      </div>
    </div>
  )
}

export function CalendarSkeleton() {
  return (
    <div className="flex w-full flex-col gap-6 md:flex-row" aria-busy="true">
      <LoadingLabel />
      <Skeleton className="h-80 w-full flex-1 rounded-[28px]" />
      <Skeleton className="h-64 w-full rounded-[28px] md:w-80 lg:w-96" />
    </div>
  )
}

export function TransactionListSkeleton() {
  return (
    <div
      className="space-y-2 md:grid md:grid-cols-2 md:gap-3 md:space-y-0"
      aria-busy="true"
    >
      <LoadingLabel />
      {Array.from({ length: 4 }, (_, index) => (
        <div
          key={index}
          className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3 md:p-4 dark:border-slate-800 dark:bg-slate-900"
        >
          <Skeleton className="size-10 shrink-0 rounded-xl md:size-12" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-16 rounded-full" />
          </div>
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  )
}

export function NoticeListSkeleton() {
  return (
    <div className="px-2" aria-busy="true">
      <LoadingLabel />
      {Array.from({ length: 4 }, (_, index) => (
        <div
          key={index}
          className="flex flex-col gap-2.5 border-b border-slate-100 px-4 py-5 last:border-b-0 dark:border-slate-800/60"
        >
          <Skeleton className="h-5 w-14 rounded-md" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-3 w-24" />
        </div>
      ))}
    </div>
  )
}

export function InsightSkeleton() {
  return (
    <section
      className="border-border bg-card rounded-[28px] border px-5 pt-5 pb-4"
      aria-busy="true"
    >
      <LoadingLabel />
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-3 h-7 w-4/5" />
      <Skeleton className="mt-2 h-7 w-2/3" />
      <div className="mt-5 flex items-center gap-5">
        <Skeleton className="size-[168px] shrink-0 rounded-full md:size-[200px]" />
        <div className="min-w-0 flex-1 space-y-3">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-4/5" />
        </div>
      </div>
    </section>
  )
}

export function ChartSkeleton() {
  return (
    <div className="mt-4 flex h-56 items-end gap-6 md:h-72" aria-busy="true">
      <LoadingLabel />
      <Skeleton className="h-2/5 flex-1 rounded-t-xl" />
      <Skeleton className="h-3/5 flex-1 rounded-t-xl" />
      <Skeleton className="h-1/2 flex-1 rounded-t-xl" />
      <Skeleton className="h-4/5 flex-1 rounded-t-xl" />
    </div>
  )
}

export function RecurringListSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true">
      <LoadingLabel />
      {Array.from({ length: 2 }, (_, index) => (
        <div
          key={index}
          className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-950/40"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="mt-3 flex gap-2">
            <Skeleton className="h-6 w-12 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  )
}
