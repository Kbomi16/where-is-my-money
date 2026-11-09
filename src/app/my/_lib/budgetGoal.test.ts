import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { filterMonthExpenses, sumAmount } from './transactionMonth.ts'
import {
  MAX_GOAL_AMOUNT,
  budgetDocumentId,
  buildBudgetWrite,
  compareWithPreviousMonth,
  dailyRecommendation,
  daysIncludingToday,
  formatUsagePercent,
  hubGoalDescription,
  isValidGoalAmount,
  monthKeyFromDate,
  parseGoalInput,
  previousMonthKey,
  readBudgetAmount,
  readMonthGoal,
  resolveDisplayedGoal,
  summarizeGoalUsage,
} from './budgetGoal.ts'
import type { Transaction } from '../../type/transaction.type.ts'

const expense = (
  date: string,
  amount: number,
  extra: Partial<Transaction> = {},
): Transaction => ({
  id: `${date}-${amount}-${extra.type ?? 'expense'}`,
  title: '테스트',
  date,
  category: '식비',
  amount,
  type: 'expense',
  ...extra,
})

describe('월 지출 합산 기준', () => {
  const items = [
    expense('2026-11-01', 1000),
    expense('2026-11-30', 2000),
    expense('2026-10-31', 9999),
    expense('2026-12-01', 8888),
    expense('2026-11-15', 500, { isExclude: true }),
    expense('2026-11-15', 700, { type: 'income' }),
    expense('2024-02-29', 29),
    expense('2024-02-28', 28),
  ]

  it('해당 월의 지출만 포함하고 통계 제외·수입은 빼며 말일을 포함한다', () => {
    const november = filterMonthExpenses(items, new Date(2026, 10, 7))
    assert.deepEqual(
      november.map((item) => item.amount),
      [1000, 2000],
    )
    assert.equal(sumAmount(november), 3000)
  })

  it('12월과 1월, 윤년 2월 29일을 서로 섞지 않는다', () => {
    const january = filterMonthExpenses(
      [
        expense('2025-12-31', 10),
        expense('2026-01-01', 20),
        expense('2026-01-31', 30),
      ],
      new Date(2026, 0, 15),
    )
    const leapFebruary = filterMonthExpenses(
      [
        expense('2024-02-29', 29),
        expense('2024-03-01', 1),
        expense('2023-02-28', 28),
      ],
      new Date(2024, 1, 10),
    )

    assert.deepEqual(
      january.map((item) => item.amount),
      [20, 30],
    )
    assert.deepEqual(
      leapFebruary.map((item) => item.amount),
      [29],
    )
  })
})

describe('월 키와 문서 ID', () => {
  it('로컬 달력 기준으로 YYYY-MM을 만들고 12월에서 1월로 넘어간다', () => {
    assert.equal(monthKeyFromDate(new Date(2026, 0, 1)), '2026-01')
    assert.equal(monthKeyFromDate(new Date(2026, 11, 31)), '2026-12')
    assert.equal(previousMonthKey('2026-01'), '2025-12')
    assert.equal(previousMonthKey('2024-03'), '2024-02')
  })

  it('사용자와 월을 문서 ID로 묶고 다른 사용자 ID는 거절한다', () => {
    assert.equal(budgetDocumentId('user_1', '2026-11'), 'user_1_2026-11')
    assert.throws(() => budgetDocumentId('a/b', '2026-11'))
    assert.throws(() => budgetDocumentId('user_1', '2026-13'))
  })
})

describe('목표 금액 검증과 표시값', () => {
  it('양수 유한 금액만 목표로 인정한다', () => {
    assert.equal(isValidGoalAmount(1), true)
    assert.equal(isValidGoalAmount(MAX_GOAL_AMOUNT), true)
    assert.equal(isValidGoalAmount(0), false)
    assert.equal(isValidGoalAmount(-1), false)
    assert.equal(isValidGoalAmount(Number.NaN), false)
    assert.equal(isValidGoalAmount(Number.POSITIVE_INFINITY), false)
    assert.equal(isValidGoalAmount(1.5), false)
  })

  it('소유자와 월이 맞는 저장값만 읽고 없으면 직전 달을 기본값으로만 보여 준다', () => {
    const saved = readBudgetAmount(
      { userId: 'me', month: '2026-11', amount: 80000 },
      'me',
      '2026-11',
    )
    const foreign = readBudgetAmount(
      { userId: 'other', month: '2026-11', amount: 80000 },
      'me',
      '2026-11',
    )
    const wrongMonth = readBudgetAmount(
      { userId: 'me', month: '2026-10', amount: 80000 },
      'me',
      '2026-11',
    )
    const previous = readBudgetAmount(
      { userId: 'me', month: '2026-10', amount: 50000 },
      'me',
      '2026-10',
    )

    assert.equal(readMonthGoal({ '2026-11': 80000, bad: 0 }, '2026-11'), 80000)
    assert.equal(readMonthGoal({ '2026-11': 80000 }, '2026-10'), null)
    assert.equal(saved, 80000)
    assert.equal(foreign, null)
    assert.equal(wrongMonth, null)
    assert.deepEqual(resolveDisplayedGoal(saved, previous), {
      amount: 80000,
      source: 'saved',
    })
    assert.deepEqual(resolveDisplayedGoal(null, previous), {
      amount: 50000,
      source: 'previous',
    })
    assert.deepEqual(resolveDisplayedGoal(null, null), {
      amount: null,
      source: 'none',
    })
  })

  it('입력 문자열을 저장 가능한 원 단위 금액으로 거른다', () => {
    assert.deepEqual(parseGoalInput(' 12,000원 '), { ok: true, amount: 12000 })
    assert.deepEqual(parseGoalInput('   '), { ok: false, reason: 'empty' })
    assert.deepEqual(parseGoalInput('0'), { ok: false, reason: 'not-positive' })
    assert.deepEqual(parseGoalInput('10.5'), { ok: false, reason: 'invalid' })
    assert.deepEqual(parseGoalInput('1e3'), { ok: false, reason: 'invalid' })
    assert.equal(parseGoalInput(String(MAX_GOAL_AMOUNT + 1)).ok, false)
  })

  it('명시 저장 payload는 로그인한 사용자와 당월 문서만 만든다', () => {
    assert.deepEqual(
      buildBudgetWrite({
        authUserId: 'me',
        monthKey: '2026-11',
        amount: 90000,
      }),
      {
        id: 'me_2026-11',
        data: { userId: 'me', month: '2026-11', amount: 90000 },
      },
    )
    assert.throws(() =>
      buildBudgetWrite({
        authUserId: 'me',
        monthKey: '2026-13',
        amount: 90000,
      }),
    )
    assert.throws(() =>
      buildBudgetWrite({
        authUserId: 'me',
        monthKey: '2026-11',
        amount: 0,
      }),
    )
  })
})

describe('사용률, 남은 금액, 하루 권장', () => {
  it('목표가 없거나 0이면 나누지 않는다', () => {
    assert.deepEqual(summarizeGoalUsage(1500, null), {
      hasGoal: false,
      percent: null,
      remaining: null,
      overAmount: 0,
      barPercent: 0,
    })
    assert.deepEqual(summarizeGoalUsage(1500, 0).hasGoal, false)
    assert.equal(
      Number.isFinite(summarizeGoalUsage(1500, 0).percent ?? 0),
      true,
    )
  })

  it('100%를 넘겨도 사용률과 초과액을 숫자로 남긴다', () => {
    assert.deepEqual(summarizeGoalUsage(50000, 100000), {
      hasGoal: true,
      percent: 50,
      remaining: 50000,
      overAmount: 0,
      barPercent: 50,
    })
    assert.deepEqual(summarizeGoalUsage(150000, 100000), {
      hasGoal: true,
      percent: 150,
      remaining: -50000,
      overAmount: 50000,
      barPercent: 100,
    })
    assert.equal(formatUsagePercent(150), '150%')
    assert.equal(formatUsagePercent(33.34), '33.3%')
  })

  it('남은 일수는 오늘을 포함하고 말일·윤년·초과를 처리한다', () => {
    assert.equal(daysIncludingToday(new Date(2026, 10, 7)), 24)
    assert.equal(daysIncludingToday(new Date(2026, 10, 30)), 1)
    assert.equal(daysIncludingToday(new Date(2024, 1, 1)), 29)
    assert.equal(daysIncludingToday(new Date(2023, 1, 1)), 28)
    assert.equal(daysIncludingToday(new Date(2024, 1, 29)), 1)
    assert.equal(daysIncludingToday(new Date(2025, 11, 31)), 1)

    assert.deepEqual(dailyRecommendation(100, new Date(2026, 10, 28)), {
      daysIncludingToday: 3,
      includesToday: true,
      amount: 33,
    })
    assert.equal(dailyRecommendation(5000, new Date(2026, 10, 30)).amount, 5000)
    assert.equal(dailyRecommendation(0, new Date(2026, 10, 7)).amount, 0)
    assert.equal(dailyRecommendation(-2000, new Date(2026, 10, 7)).amount, 0)
    assert.equal(dailyRecommendation(null, new Date(2026, 10, 7)).amount, null)
  })
})

describe('지난달 비교', () => {
  it('지난달 목표 문서가 있을 때만 달성 여부와 지출 차이를 낸다', () => {
    assert.equal(
      compareWithPreviousMonth({
        previousGoal: null,
        previousSpent: 1000,
        currentSpent: 100,
      }),
      null,
    )

    assert.deepEqual(
      compareWithPreviousMonth({
        previousGoal: 100000,
        previousSpent: 80000,
        currentSpent: 10000,
      }),
      {
        achieved: true,
        overAmount: 0,
        spentDelta: -70000,
        ratio: 0.125,
        inProgress: true,
      },
    )
  })

  it('지난달 지출이 0원이면 비율을 나누지 않고 초과는 초과액으로 보여 준다', () => {
    const over = compareWithPreviousMonth({
      previousGoal: 1000,
      previousSpent: 2500,
      currentSpent: 0,
    })
    assert.equal(over?.achieved, false)
    assert.equal(over?.overAmount, 1500)
    assert.equal(over?.ratio, 0)

    const zeroBase = compareWithPreviousMonth({
      previousGoal: 1000,
      previousSpent: 0,
      currentSpent: 400,
    })
    assert.equal(zeroBase?.ratio, null)
    assert.equal(zeroBase?.spentDelta, 400)
    assert.equal(zeroBase?.achieved, true)
  })
})

describe('허브 문구', () => {
  it('저장된 이번 달 목표가 없으면 미설정을 유지하고 있으면 금액을 붙인다', () => {
    assert.equal(
      hubGoalDescription(8900, null),
      '이번 달 8,900원 · 목표 미설정',
    )
    assert.equal(
      hubGoalDescription(8900, 100000),
      '이번 달 8,900원 · 목표 100,000원',
    )
  })
})
