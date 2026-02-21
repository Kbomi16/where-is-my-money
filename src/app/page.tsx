import { SummaryCards } from './_components/SummaryCards'
import { TransactionList } from './_components/TransactionList'
import { AddTransactionBtn } from './_components/AddTransactionBtn'
import { MonthNavigator } from './_components/MonthNavigator'

export default function Home() {
  return (
    <main className="base-layout min-h-[calc(100vh-4rem)] space-y-6 py-6 pb-24">
      <MonthNavigator />

      <SummaryCards income={0} expense={0} />

      <TransactionList items={[]} />

      <AddTransactionBtn />
    </main>
  )
}
