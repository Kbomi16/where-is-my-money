export const MAX_GOAL_AMOUNT = 999_999_999

const MONTH_KEY = /^(\d{4})-(0[1-9]|1[0-2])$/

export function monthKeyFromDate(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${date.getFullYear()}-${month}`
}

export function isValidMonthKey(monthKey: string) {
  return MONTH_KEY.test(monthKey)
}

export function previousMonthKey(monthKey: string) {
  const match = MONTH_KEY.exec(monthKey)
  if (!match) throw new Error('invalid month')

  const year = Number(match[1])
  const month = Number(match[2])
  return monthKeyFromDate(new Date(year, month - 2, 1))
}

export function isSafeUserId(userId: string) {
  return (
    userId.length > 0 &&
    userId.length <= 128 &&
    !userId.includes('/') &&
    !userId.includes('\\') &&
    !userId.includes('\0')
  )
}

export function budgetDocumentId(userId: string, monthKey: string) {
  if (!isSafeUserId(userId) || !isValidMonthKey(monthKey)) {
    throw new Error('invalid budget document')
  }
  return `${userId}_${monthKey}`
}

export function isValidGoalAmount(amount: unknown): amount is number {
  return (
    typeof amount === 'number' &&
    Number.isInteger(amount) &&
    Number.isFinite(amount) &&
    amount > 0 &&
    amount <= MAX_GOAL_AMOUNT
  )
}

type BudgetDoc = {
  userId?: unknown
  month?: unknown
  amount?: unknown
} | null

export function readMonthGoal(goals: unknown, monthKey: string) {
  if (!isValidMonthKey(monthKey) || !goals || typeof goals !== 'object') {
    return null
  }
  const amount = (goals as Record<string, unknown>)[monthKey]
  return isValidGoalAmount(amount) ? amount : null
}

export function readBudgetAmount(
  doc: BudgetDoc,
  userId: string,
  monthKey: string,
) {
  if (!doc) return null
  if (doc.userId !== userId || doc.month !== monthKey) return null
  if (!isValidGoalAmount(doc.amount)) return null
  return doc.amount
}

export function resolveDisplayedGoal(
  savedAmount: number | null,
  previousAmount: number | null,
) {
  if (savedAmount != null)
    return { amount: savedAmount, source: 'saved' as const }
  if (previousAmount != null) {
    return { amount: previousAmount, source: 'previous' as const }
  }
  return { amount: null, source: 'none' as const }
}

export function parseGoalInput(raw: string) {
  const normalized = raw.replaceAll(',', '').replaceAll('원', '').trim()
  if (!normalized) return { ok: false as const, reason: 'empty' as const }
  if (!/^[1-9]\d*$/.test(normalized)) {
    if (/^0+$/.test(normalized)) {
      return { ok: false as const, reason: 'not-positive' as const }
    }
    return { ok: false as const, reason: 'invalid' as const }
  }

  const amount = Number(normalized)
  if (!Number.isSafeInteger(amount) || amount > MAX_GOAL_AMOUNT) {
    return { ok: false as const, reason: 'too-large' as const }
  }
  return { ok: true as const, amount }
}

export function buildBudgetWrite(input: {
  authUserId: string
  monthKey: string
  amount: number
}) {
  if (!isValidGoalAmount(input.amount)) throw new Error('invalid amount')

  return {
    id: budgetDocumentId(input.authUserId, input.monthKey),
    data: {
      userId: input.authUserId,
      month: input.monthKey,
      amount: input.amount,
    },
  }
}

export function summarizeGoalUsage(spent: number, goal: number | null) {
  if (!isValidGoalAmount(goal) || !Number.isFinite(spent)) {
    return {
      hasGoal: false,
      percent: null,
      remaining: null,
      overAmount: 0,
      barPercent: 0,
    }
  }

  const percent = (spent / goal) * 100
  const remaining = goal - spent
  return {
    hasGoal: true,
    percent,
    remaining,
    overAmount: Math.max(0, spent - goal),
    barPercent: Math.min(100, Math.max(0, percent)),
  }
}

export function formatUsagePercent(percent: number) {
  if (!Number.isFinite(percent)) return '0%'
  const rounded = Math.round(percent * 10) / 10
  return Number.isInteger(rounded) ? `${rounded}%` : `${rounded.toFixed(1)}%`
}

export function daysIncludingToday(date: Date) {
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  return lastDay - date.getDate() + 1
}

export function dailyRecommendation(remaining: number | null, date: Date) {
  const days = daysIncludingToday(date)
  if (remaining == null || !Number.isFinite(remaining)) {
    return {
      daysIncludingToday: days,
      includesToday: true as const,
      amount: null,
    }
  }
  if (remaining <= 0) {
    return { daysIncludingToday: days, includesToday: true as const, amount: 0 }
  }
  return {
    daysIncludingToday: days,
    includesToday: true as const,
    amount: Math.floor(remaining / days),
  }
}

export function compareWithPreviousMonth(input: {
  previousGoal: number | null
  previousSpent: number
  currentSpent: number
}) {
  if (!isValidGoalAmount(input.previousGoal)) return null
  if (
    !Number.isFinite(input.previousSpent) ||
    !Number.isFinite(input.currentSpent)
  ) {
    return null
  }

  return {
    achieved: input.previousSpent <= input.previousGoal,
    overAmount: Math.max(0, input.previousSpent - input.previousGoal),
    spentDelta: input.currentSpent - input.previousSpent,
    ratio:
      input.previousSpent > 0 ? input.currentSpent / input.previousSpent : null,
    inProgress: true as const,
  }
}

export function homeGoalCardModel(input: {
  budgetLoading: boolean
  transactionsLoading: boolean
  error: string | null
  savedAmount: number | null
  previousAmount: number | null
  spent: number
  date: Date
}) {
  if (input.budgetLoading || input.transactionsLoading) {
    return { kind: 'loading' as const }
  }
  if (input.error) {
    return {
      kind: 'error' as const,
      permission: input.error.includes('권한'),
      message: input.error,
    }
  }
  if (!isValidGoalAmount(input.savedAmount)) {
    return { kind: 'unset' as const }
  }

  const spent =
    Number.isFinite(input.spent) && input.spent > 0 ? input.spent : 0
  const usage = summarizeGoalUsage(spent, input.savedAmount)
  const daily = dailyRecommendation(usage.remaining, input.date)
  const percent = usage.percent ?? 0
  const tone: 'under' | 'watch' | 'over' =
    percent > 100 ? 'over' : percent >= 70 ? 'watch' : 'under'
  const toneLabel =
    tone === 'over' ? '초과' : tone === 'watch' ? '주의' : '여유'
  const line =
    usage.overAmount > 0
      ? `목표보다 ${usage.overAmount.toLocaleString('ko-KR')}원 초과 · 오늘 포함 하루 ${daily.amount?.toLocaleString('ko-KR')}원`
      : `남음 ${(usage.remaining ?? 0).toLocaleString('ko-KR')}원 · 오늘 포함 하루 ${daily.amount?.toLocaleString('ko-KR')}원`

  return {
    kind: 'ready' as const,
    spent,
    goal: input.savedAmount,
    percent,
    percentLabel: formatUsagePercent(percent),
    barPercent: usage.barPercent,
    tone,
    toneLabel,
    remaining: usage.remaining ?? 0,
    overAmount: usage.overAmount,
    dailyAmount: daily.amount ?? 0,
    daysIncludingToday: daily.daysIncludingToday,
    line,
  }
}

export function hubGoalDescription(spent: number, savedAmount: number | null) {
  const spentLabel = `이번 달 ${spent.toLocaleString('ko-KR')}원`
  if (!isValidGoalAmount(savedAmount)) return `${spentLabel} · 목표 미설정`
  return `${spentLabel} · 목표 ${savedAmount.toLocaleString('ko-KR')}원`
}
