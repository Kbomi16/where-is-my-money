export type Transaction = {
  id: string // Firestore 문서 ID
  title: string // 거래명
  date: string // 'YYYY-MM-DD' 형식
  category: string // '식비', '교통', '생활' 등
  amount: number // 금액 (양수로 통일)
  type: 'income' | 'expense' // 수입인지 지출인지
  method?:
    | 'check'
    | 'credit'
    | 'cash'
    | 'bank'
    | 'kakaoPay'
    | 'naverPay'
    | 'applePay'
    | 'tossPay'
    | 'etc' // 결제 수단 (지출일 때만)
  memo?: string // 메모 (선택 사항)
  isExclude?: boolean // 통계 제외 여부 (기본값: false)
  recurringEnabled?: boolean // 매달 반복 여부
  recurringEndType?: 'none' | 'months' // 반복 종료 방식
  recurringMonths?: number // 반복 종료 개월 수
  installmentTotal?: number // 총 할부 개월
  installmentIndex?: number // 현재 할부 회차 (1부터)
  installmentGroupId?: string // 같은 할부 건을 묶는 ID
}
