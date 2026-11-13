/** localStorage 키: 유저 + YYYY-MM 단위로 닫힘 상태를 기억한다. */
export function goalNudgeStorageKey(
  uid: string | null | undefined,
  monthKey: string,
) {
  return `goal-nudge:${uid ?? 'local'}:${monthKey}`
}

export function isGoalNudgeDismissed(raw: string | null | undefined) {
  return raw === '1'
}

export function goalNudgeDismissValue() {
  return '1'
}

export function monthLabelFromDate(date: Date) {
  return `${date.getMonth() + 1}월`
}
