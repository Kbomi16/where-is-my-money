import { create } from 'zustand'
import { Transaction } from '../type/transaction.type'

type TransactionState = {
  transactions: Transaction[]
  setTransactions: (data: Transaction[]) => void
}

export const useTransactionStore = create<TransactionState>((set) => ({
  transactions: [],
  setTransactions: (data) => set({ transactions: data }),
}))
