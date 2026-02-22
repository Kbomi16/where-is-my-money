export type Transaction = {
  id: string // Firestore 문서 ID
  title: string // 거래명
  date: string // 'YYYY-MM-DD' 형식
  category: string // '식비', '교통', '생활' 등
  amount: number // 금액 (양수로 통일)
  type: 'income' | 'expense' // 수입인지 지출인지
  method?: 'check' | 'credit' | 'cash' // 결제 수단 (지출일 때만)
  memo?: string // 메모 (선택 사항)
}
