import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { homeGoalCardModel } from '../my/_lib/budgetGoal.ts'

const date = new Date(2026, 10, 7)

const base = {
  budgetLoading: false,
  transactionsLoading: false,
  error: null as string | null,
  savedAmount: 100_000 as number | null,
  previousAmount: null as number | null,
  spent: 0,
  date,
}

describe('홈 목표 카드 상태', () => {
  it('70% 미만은 여유, 70%와 100%는 주의, 100% 초과는 초과로 숫자와 막대를 나눈다', () => {
    const under = homeGoalCardModel({ ...base, spent: 69_000 })
    const watch = homeGoalCardModel({ ...base, spent: 70_000 })
    const full = homeGoalCardModel({ ...base, spent: 100_000 })
    const over = homeGoalCardModel({ ...base, spent: 150_000 })

    assert.equal(under.kind, 'ready')
    assert.equal(watch.kind, 'ready')
    assert.equal(full.kind, 'ready')
    assert.equal(over.kind, 'ready')
    if (
      under.kind !== 'ready' ||
      watch.kind !== 'ready' ||
      full.kind !== 'ready' ||
      over.kind !== 'ready'
    ) {
      return
    }

    assert.equal(under.tone, 'under')
    assert.equal(under.toneLabel, '여유')
    assert.equal(under.percentLabel, '69%')
    assert.equal(under.barPercent, 69)

    assert.equal(watch.tone, 'watch')
    assert.equal(watch.toneLabel, '주의')
    assert.equal(watch.percentLabel, '70%')
    assert.equal(watch.barPercent, 70)

    assert.equal(full.tone, 'watch')
    assert.equal(full.toneLabel, '주의')
    assert.equal(full.percentLabel, '100%')
    assert.equal(full.barPercent, 100)
    assert.equal(full.remaining, 0)
    assert.equal(full.dailyAmount, 0)
    assert.match(full.line, /남음 0원/)
    assert.match(full.line, /오늘 포함 하루 0원/)
    assert.doesNotMatch(full.line, /괜찮/)

    assert.equal(over.tone, 'over')
    assert.equal(over.toneLabel, '초과')
    assert.equal(over.percentLabel, '150%')
    assert.equal(over.barPercent, 100)
    assert.equal(over.overAmount, 50_000)
    assert.equal(over.dailyAmount, 0)
    assert.match(over.line, /50,000원 초과/)
    assert.match(over.line, /오늘 포함 하루 0원/)
    assert.doesNotMatch(over.line, /괜찮|여유/)
  })

  it('당월 저장 목표가 없으면 전월 금액이 있어도 미설정이다', () => {
    const unset = homeGoalCardModel({
      ...base,
      savedAmount: null,
      previousAmount: 80_000,
      spent: 10_000,
    })
    assert.deepEqual(unset, { kind: 'unset' })

    const invalid = homeGoalCardModel({
      ...base,
      savedAmount: 0,
      previousAmount: 80_000,
    })
    assert.equal(invalid.kind, 'unset')

    const negativeGoal = homeGoalCardModel({
      ...base,
      savedAmount: -1000,
    })
    assert.equal(negativeGoal.kind, 'unset')
  })

  it('지출 0원은 남은 목표를 하루 권장액으로 나누고 음수 지출은 0으로 본다', () => {
    const zero = homeGoalCardModel({ ...base, spent: 0 })
    assert.equal(zero.kind, 'ready')
    if (zero.kind !== 'ready') return
    assert.equal(zero.percentLabel, '0%')
    assert.equal(zero.tone, 'under')
    assert.equal(zero.remaining, 100_000)
    assert.equal(zero.daysIncludingToday, 24)
    assert.equal(zero.dailyAmount, Math.floor(100_000 / 24))
    assert.match(zero.line, /남음 100,000원/)
    assert.match(zero.line, /오늘 포함/)

    const negativeSpent = homeGoalCardModel({ ...base, spent: -500 })
    assert.equal(negativeSpent.kind, 'ready')
    if (negativeSpent.kind !== 'ready') return
    assert.equal(negativeSpent.spent, 0)
    assert.equal(negativeSpent.percentLabel, '0%')
  })

  it('로딩과 권한 오류는 목표 없음으로 보이지 않는다', () => {
    assert.deepEqual(
      homeGoalCardModel({ ...base, budgetLoading: true, savedAmount: null }),
      { kind: 'loading' },
    )
    assert.deepEqual(
      homeGoalCardModel({
        ...base,
        transactionsLoading: true,
        savedAmount: 100_000,
      }),
      { kind: 'loading' },
    )

    const denied = homeGoalCardModel({
      ...base,
      error: '목표를 보거나 저장할 권한이 없어요.',
      savedAmount: null,
      previousAmount: 80_000,
    })
    assert.equal(denied.kind, 'error')
    if (denied.kind !== 'error') return
    assert.equal(denied.permission, true)
    assert.match(denied.message, /권한/)
  })
})
