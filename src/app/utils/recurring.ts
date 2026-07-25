import { addDoc, collection, serverTimestamp, type Firestore } from 'firebase/firestore'
import { addMonths, differenceInMonths, endOfMonth, format, parseISO, startOfMonth } from 'date-fns'
import { Transaction } from '../type/transaction.type'

export async function syncRecurringTransactions({
  currentDate,
  transactions,
  userId,
  firestoreDb,
}: {
  currentDate: Date
  transactions: Transaction[]
  userId: string
  firestoreDb: Firestore
}) {
  const targetMonthStart = startOfMonth(currentDate)
  const targetMonthStartDate = format(targetMonthStart, 'yyyy-MM-dd')
  const targetMonthEndDate = format(endOfMonth(targetMonthStart), 'yyyy-MM-dd')

  const recurringTemplates = transactions.filter(
    (item) =>
      item.userId === userId &&
      item.type === 'expense' &&
      item.recurringEnabled &&
      !!item.date,
  )

  for (const template of recurringTemplates) {
    const baseDate = parseISO(template.date)
    const monthDiff = differenceInMonths(targetMonthStart, startOfMonth(baseDate))

    if (monthDiff <= 0) continue

    if (template.recurringEndType === 'months') {
      const recurringLimit = template.recurringMonths ?? 1
      if (monthDiff >= recurringLimit) continue
    }

    const alreadyExists = transactions.some(
      (item) =>
        item.userId === userId &&
        item.recurringParentId === template.id &&
        item.date >= targetMonthStartDate &&
        item.date <= targetMonthEndDate,
    )

    if (alreadyExists) continue

    const generatedDate = format(addMonths(baseDate, monthDiff), 'yyyy-MM-dd')
    const { id, createdAt, updatedAt, ...rest } = template

    await addDoc(collection(firestoreDb, 'transactions'), {
      ...rest,
      userId,
      date: generatedDate,
      recurringEnabled: false,
      recurringParentId: template.id,
      recurringEndType: 'none',
      recurringMonths: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  }
}
