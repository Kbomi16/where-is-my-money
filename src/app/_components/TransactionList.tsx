interface Transaction {
  id: number
  title: string
  date: string
  category: string
  amount: number
  type: 'income' | 'expense'
}

export function TransactionList({ items }: { items: Transaction[] }) {
  return (
    <section className="space-y-4">
      <h3 className="px-1 text-lg font-semibold">최근 소비 내역</h3>
      <div className="border-border bg-card overflow-hidden rounded-xl border">
        {items.length > 0 ? (
          items.map((item) => (
            <div
              key={item.id}
              className="border-border hover:bg-muted/5 flex items-center justify-between border-b p-4 transition-colors last:border-0"
            >
              <div>
                <p className="text-foreground font-medium">{item.title}</p>
                <p className="text-muted text-xs">
                  {item.date} • {item.category}
                </p>
              </div>
              <p
                className={`font-semibold ${item.type === 'income' ? 'text-income' : 'text-expense'}`}
              >
                {item.type === 'income' ? '+' : '-'} ₩{' '}
                {item.amount.toLocaleString()}
              </p>
            </div>
          ))
        ) : (
          <div className="text-muted p-8 text-center">내역이 없습니다.</div>
        )}
      </div>
    </section>
  )
}
