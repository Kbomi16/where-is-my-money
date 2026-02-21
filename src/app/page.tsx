import { AddTransactionBtn } from './_components/AddTransactionBtn'
import { SummaryCards } from './_components/SummaryCards'
import { TransactionList } from './_components/TransactionList'

// 임시 데이터 (나중에 DB 연동 예정)
const mockData = [
  {
    id: 1,
    title: '스타벅스 커피',
    date: '2024.05.22',
    category: '식비',
    amount: 5500,
    type: 'expense' as const,
  },
  {
    id: 2,
    title: '월급',
    date: '2024.05.21',
    category: '수입',
    amount: 3000000,
    type: 'income' as const,
  },
  {
    id: 3,
    title: '유튜브 프리미엄',
    date: '2024.05.20',
    category: '생활',
    amount: 14900,
    type: 'expense' as const,
  },
]

export default function Home() {
  return (
    <main className="base-layout min-h-[calc(100vh-12rem)] space-y-8 py-8">
      {/* 1. 요약 카드 (데이터 전달) */}
      <SummaryCards total={2540000} income={3000000} expense={460000} />

      {/* 2. 추가 버튼 */}
      <AddTransactionBtn />

      {/* 3. 내역 리스트 */}
      <TransactionList items={mockData} />
    </main>
  )
}
