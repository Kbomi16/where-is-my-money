import type { LucideIcon } from 'lucide-react'

type PageHeaderProps = {
  icon: LucideIcon
  title: string
  description: string
}

export default function PageHeader({
  icon: Icon,
  title,
  description,
}: PageHeaderProps) {
  return (
    <div className="pb-10">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
        <Icon size={28} className="text-accent" />
      </div>
      <h1 className="text-3xl font-black tracking-tight text-slate-900 md:text-4xl dark:text-slate-50">
        {title}
      </h1>
      <p className="mt-3 text-slate-500 dark:text-slate-400">{description}</p>
    </div>
  )
}
