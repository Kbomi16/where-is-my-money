import { create } from 'zustand'

interface Transaction {
  id: string
  title: string
  amount: number
  type: 'income' | 'expense'
  date: string
}

interface TransactionState {
  transactions: Transaction[]
  setTransactions: (data: Transaction[]) => void
}

export const useTransactionStore = create<TransactionState>((set) => ({
  transactions: [],
  setTransactions: (data) => set({ transactions: data }),
}))
