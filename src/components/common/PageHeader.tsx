type PageHeaderProps = {
  title: string
  description: string
}

export default function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <header>
      <h1 className="text-[22px] font-extrabold tracking-tight md:text-[28px]">
        {title}
      </h1>
      <p className="text-muted mt-0.5 mb-3 text-[13px] font-semibold md:mb-5 md:text-sm">
        {description}
      </p>
    </header>
  )
}
