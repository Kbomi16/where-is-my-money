export function maskEmail(email?: string | null) {
  if (!email) return '이메일 없음'

  const [local, domain] = email.split('@')
  if (!domain || !local) return email

  const visibleLength = Math.min(4, Math.max(1, local.length - 2))
  const visible = local.slice(0, visibleLength)
  const hiddenLength = Math.max(4, local.length - visible.length)

  return `${visible}${'*'.repeat(hiddenLength)}@${domain}`
}

export function formatCompactAmount(amount: number) {
  if (amount >= 1000) {
    const thousands = amount / 1000
    const rounded =
      thousands >= 100 ? Math.round(thousands) : Math.round(thousands * 10) / 10
    return `${rounded.toLocaleString()}k`
  }

  return amount.toLocaleString()
}

export function formatMonthLabel(date: Date) {
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월`
}

export function daysUntilMonthEndLabel(date: Date) {
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0)
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const days = Math.round((end.getTime() - start.getTime()) / 86_400_000)

  if (days <= 0) return '오늘이 말일'
  return `말일까지 ${days}일`
}

export function recurringSummary(titles: string[]) {
  if (titles.length === 0) return '아직 없어요'

  const names = titles.slice(0, 2)
  const rest = titles.length - names.length

  if (rest > 0) return `${names.join(' · ')} 외 ${rest}건`
  return names.join(' · ')
}
