import BackButton from './BackButton'

type PageHeaderProps = {
  title: string
  description: string
  backHref?: string
  backLabel?: string
}

export default function PageHeader({
  title,
  description,
  backHref,
  backLabel = '이전으로 돌아가기',
}: PageHeaderProps) {
  return (
    <header>
      {backHref && (
        <div className="mb-2">
          <BackButton href={backHref} label={backLabel} />
        </div>
      )}
      <h1 className="text-[22px] font-extrabold tracking-tight md:text-[28px]">
        {title}
      </h1>
      <p className="text-muted mt-0.5 mb-3 text-[13px] font-semibold md:mb-5 md:text-sm">
        {description}
      </p>
    </header>
  )
}
