import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  goalNudgeDismissValue,
  goalNudgeStorageKey,
  isGoalNudgeDismissed,
  monthLabelFromDate,
} from './homeGoalNudge.ts'

describe('홈 목표 넛지 dismiss 키', () => {
  it('유저와 YYYY-MM으로 키를 만들고 local이면 local을 쓴다', () => {
    assert.equal(
      goalNudgeStorageKey('abc', '2026-11'),
      'goal-nudge:abc:2026-11',
    )
    assert.equal(
      goalNudgeStorageKey(null, '2026-11'),
      'goal-nudge:local:2026-11',
    )
    assert.equal(
      goalNudgeStorageKey(undefined, '2026-12'),
      'goal-nudge:local:2026-12',
    )
  })

  it('저장값이 1일 때만 닫힌 것으로 본다', () => {
    assert.equal(isGoalNudgeDismissed('1'), true)
    assert.equal(isGoalNudgeDismissed(null), false)
    assert.equal(isGoalNudgeDismissed(undefined), false)
    assert.equal(isGoalNudgeDismissed('0'), false)
    assert.equal(isGoalNudgeDismissed('true'), false)
    assert.equal(goalNudgeDismissValue(), '1')
  })

  it('월 라벨은 1~12월이다', () => {
    assert.equal(monthLabelFromDate(new Date(2026, 10, 9)), '11월')
    assert.equal(monthLabelFromDate(new Date(2026, 0, 1)), '1월')
    assert.equal(monthLabelFromDate(new Date(2026, 11, 31)), '12월')
  })
})
