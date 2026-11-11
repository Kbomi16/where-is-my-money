export type CategoryKind = 'expense' | 'income'

export type CategoryDefinition = {
  name: string
  defaultEnabled: boolean
}

export const CATEGORY_CATALOG: Record<CategoryKind, CategoryDefinition[]> = {
  expense: [
    { name: '식비', defaultEnabled: true },
    { name: '교통', defaultEnabled: true },
    { name: '생활', defaultEnabled: true },
    { name: '의료', defaultEnabled: true },
    { name: '쇼핑', defaultEnabled: true },
    { name: '카페', defaultEnabled: true },
    { name: '오락', defaultEnabled: true },
    { name: '주거', defaultEnabled: false },
    { name: '구독', defaultEnabled: false },
    { name: '운동', defaultEnabled: false },
    { name: '경조사', defaultEnabled: false },
    { name: '기타', defaultEnabled: true },
  ],
  income: [
    { name: '월급', defaultEnabled: true },
    { name: '부수입', defaultEnabled: true },
    { name: '용돈', defaultEnabled: true },
    { name: '금융수익', defaultEnabled: true },
    { name: '정산', defaultEnabled: true },
    { name: '상여', defaultEnabled: false },
    { name: '환급', defaultEnabled: false },
    { name: '기타', defaultEnabled: true },
  ],
}

export const CATEGORIES = {
  expense: CATEGORY_CATALOG.expense.map((item) => item.name),
  income: CATEGORY_CATALOG.income.map((item) => item.name),
}

export const isLockedCategory = (name: string) => name === '기타'
