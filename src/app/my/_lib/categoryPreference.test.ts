import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  categoriesForSelect,
  categoriesForSpendList,
  categoryHint,
  emptyCategoryOverrides,
  isCategoryEnabled,
  readCategoryOverrides,
  withCategoryOverride,
} from './categoryPreference.ts'

describe('카테고리 켜짐', () => {
  it('저장이 없으면 기존 이름은 켜지고 새 이름은 꺼진다', () => {
    const overrides = emptyCategoryOverrides()

    assert.equal(isCategoryEnabled('expense', '식비', overrides), true)
    assert.equal(isCategoryEnabled('expense', '주거', overrides), false)
    assert.equal(isCategoryEnabled('income', '월급', overrides), true)
    assert.equal(isCategoryEnabled('income', '상여', overrides), false)
    assert.equal(isCategoryEnabled('expense', '기타', overrides), true)
  })

  it('기본값과 다른 선택만 읽고 기타는 끄지 않는다', () => {
    const overrides = readCategoryOverrides({
      expense: { 카페: false, 주거: true, 기타: false, 없는이름: false },
      income: { 상여: true, 월급: true },
    })

    assert.deepEqual(overrides.expense, { 카페: false, 주거: true })
    assert.deepEqual(overrides.income, { 상여: true })
    assert.equal(isCategoryEnabled('expense', '기타', overrides), true)
    assert.equal(isCategoryEnabled('expense', '카페', overrides), false)
    assert.equal(isCategoryEnabled('expense', '주거', overrides), true)
  })

  it('다시 기본값으로 두면 저장값에서 뺀다', () => {
    const turnedOff = withCategoryOverride(
      emptyCategoryOverrides(),
      'expense',
      '카페',
      false,
    )
    const restored = withCategoryOverride(turnedOff, 'expense', '카페', true)

    assert.deepEqual(restored.expense, {})
    assert.equal(
      withCategoryOverride(turnedOff, 'expense', '기타', false),
      turnedOff,
    )
  })

  it('새 기록에는 켜진 이름만, 수정 중인 꺼진 이름은 남긴다', () => {
    const overrides = withCategoryOverride(
      emptyCategoryOverrides(),
      'expense',
      '카페',
      false,
    )

    assert.equal(categoriesForSelect('expense', overrides).includes('카페'), false)
    assert.equal(
      categoriesForSelect('expense', overrides, '카페').includes('카페'),
      true,
    )
    assert.equal(categoriesForSelect('expense', overrides).includes('주거'), false)
  })

  it('예산 목록은 켜진 이름과 이번 달 지출이 있는 이름을 보여 준다', () => {
    const overrides = withCategoryOverride(
      emptyCategoryOverrides(),
      'expense',
      '카페',
      false,
    )
    const names = categoriesForSpendList(
      'expense',
      overrides,
      new Map([
        ['카페', 1200],
        ['주거', 0],
      ]),
    )

    assert.equal(names.includes('카페'), true)
    assert.equal(names.includes('주거'), false)
    assert.equal(names.includes('식비'), true)
  })

  it('마이 안내는 켜진 지출 이름 앞에서 세 개다', () => {
    const overrides = withCategoryOverride(
      emptyCategoryOverrides(),
      'expense',
      '식비',
      false,
    )

    assert.equal(categoryHint(overrides), '교통 · 생활 · 의료처럼 나눠요')
  })
})
