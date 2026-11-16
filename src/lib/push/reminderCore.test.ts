import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  REMINDER_COPY,
  REMINDER_LINK,
  buildReminderMessage,
  formatKst,
  isCronAuthorized,
  kstDateKey,
  parseFlag,
  parseReminderSlot,
  redactUid,
  resolveReminderSlot,
} from './reminderCore.ts'

// KST 시각 → Date (KST = UTC+9, 서머타임 없음)
const kst = (iso: string) => new Date(`${iso}+09:00`)

describe('resolveReminderSlot (KST 경계)', () => {
  it('09:00 정각은 morning, 창은 전날 19:00부터 (자정 넘김)', () => {
    const r = resolveReminderSlot(kst('2026-11-16T09:00:00'))
    assert.equal(r.slot, 'morning')
    assert.equal(r.slotKey, '2026-11-16:morning')
    assert.equal(r.startMs, kst('2026-11-16T09:00:00').getTime())
    assert.equal(r.windowStartMs, kst('2026-11-15T19:00:00').getTime())
  })
  it('08:59:59는 아직 전날 evening', () => {
    const r = resolveReminderSlot(kst('2026-11-16T08:59:59'))
    assert.equal(r.slotKey, '2026-11-15:evening')
    assert.equal(r.windowStartMs, kst('2026-11-15T13:00:00').getTime())
  })
  it('Hobby 크론이 59분 늦게 와도 같은 슬롯 (13:59 → lunch, 창 09:00~)', () => {
    const r = resolveReminderSlot(kst('2026-11-16T13:59:00'))
    assert.equal(r.slotKey, '2026-11-16:lunch')
    assert.equal(r.windowStartMs, kst('2026-11-16T09:00:00').getTime())
  })
  it('12:59 → morning, 19:00 → evening(창 13:00~)', () => {
    assert.equal(resolveReminderSlot(kst('2026-11-16T12:59:00')).slot, 'morning')
    const e = resolveReminderSlot(kst('2026-11-16T19:00:00'))
    assert.equal(e.slotKey, '2026-11-16:evening')
    assert.equal(e.windowStartMs, kst('2026-11-16T13:00:00').getTime())
  })
  it('KST 자정 직후(UTC로는 전날 15시)는 전날 evening', () => {
    const r = resolveReminderSlot(new Date('2026-11-16T15:30:00Z')) // KST 11-17 00:30
    assert.equal(r.slotKey, '2026-11-16:evening')
  })
  it('UTC 크론 시각(00:00·04:00·10:00)이 각 슬롯으로 풀린다', () => {
    assert.equal(resolveReminderSlot(new Date('2026-11-16T00:00:00Z')).slotKey, '2026-11-16:morning')
    assert.equal(resolveReminderSlot(new Date('2026-11-16T04:00:00Z')).slotKey, '2026-11-16:lunch')
    assert.equal(resolveReminderSlot(new Date('2026-11-16T10:00:00Z')).slotKey, '2026-11-16:evening')
  })
  it('override: 아직 안 온 오늘 슬롯이면 어제 것을 쓴다', () => {
    const r = resolveReminderSlot(kst('2026-11-16T10:00:00'), 'lunch')
    assert.equal(r.slotKey, '2026-11-15:lunch')
    assert.equal(r.windowStartMs, kst('2026-11-15T09:00:00').getTime())
  })
  it('override: 지난 오늘 슬롯이면 오늘 것, morning은 전날 19시부터', () => {
    assert.equal(resolveReminderSlot(kst('2026-11-16T21:00:00'), 'lunch').slotKey, '2026-11-16:lunch')
    const m = resolveReminderSlot(kst('2026-11-16T21:00:00'), 'morning')
    assert.equal(m.slotKey, '2026-11-16:morning')
    assert.equal(m.windowStartMs, kst('2026-11-15T19:00:00').getTime())
  })
  it('월·연 경계도 전날로 넘어간다', () => {
    const r = resolveReminderSlot(kst('2027-01-01T09:10:00'))
    assert.equal(r.slotKey, '2027-01-01:morning')
    assert.equal(kstDateKey(r.windowStartMs), '2026-12-31')
  })
})

describe('문구·메시지', () => {
  it('슬롯별 확정 문구 + 고정 링크 + 슬롯 tag', () => {
    assert.deepEqual(buildReminderMessage({ slot: 'lunch', slotKey: '2026-11-16:lunch' }), {
      title: '🍚 점심 맛있게 먹었어요?',
      body: '얼마였는지 까먹기 전에 콕 기록해요!',
      link: REMINDER_LINK,
      tag: 'reminder:2026-11-16:lunch',
    })
    assert.equal(REMINDER_COPY.morning.title, '☀️ 좋은 아침! 벌써 뭐 샀어요?')
    assert.equal(REMINDER_COPY.morning.body, '커피값도 소중하니까 살짝 남겨 둬요 ☕')
    assert.equal(REMINDER_COPY.evening.title, '🌙 오늘 내 돈 어디 갔지?')
    assert.equal(REMINDER_COPY.evening.body, '오늘 쓴 돈, 자기 전에 정리해 볼까요?')
  })
  it('formatKst', () => {
    assert.equal(formatKst(new Date('2026-11-16T04:00:00Z').getTime()), '2026-11-16 13:00')
  })
})

describe('입력·인증', () => {
  it('parseReminderSlot / parseFlag', () => {
    assert.equal(parseReminderSlot('lunch'), 'lunch')
    assert.equal(parseReminderSlot('LUNCH'), null)
    assert.equal(parseReminderSlot(null), null)
    assert.equal(parseFlag('1'), true)
    assert.equal(parseFlag('true'), true)
    assert.equal(parseFlag('0'), false)
    assert.equal(parseFlag(null), false)
  })
  it('isCronAuthorized: Bearer + 정확히 같은 값만', () => {
    assert.equal(isCronAuthorized('Bearer s3cret', 's3cret'), true)
    assert.equal(isCronAuthorized('Bearer s3cret', ' s3cret\n'), true)
    assert.equal(isCronAuthorized('Bearer s3creT', 's3cret'), false)
    assert.equal(isCronAuthorized('s3cret', 's3cret'), false)
    assert.equal(isCronAuthorized(null, 's3cret'), false)
  })
  it('시크릿이 비어 있으면 항상 거부', () => {
    assert.equal(isCronAuthorized('Bearer ', ''), false)
    assert.equal(isCronAuthorized('Bearer undefined', undefined), false)
  })
  it('redactUid', () => {
    assert.equal(redactUid('abcdef123'), 'abcd…')
  })
})
