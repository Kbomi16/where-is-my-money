'use client'

import { useEffect, useState } from 'react'
import { doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import {
  budgetDocumentId,
  buildBudgetWrite,
  monthKeyFromDate,
  parseGoalInput,
  previousMonthKey,
  readBudgetAmount,
} from '../_lib/budgetGoal'

type DocState = {
  status: 'loading' | 'ready' | 'error'
  amount: number | null
  message: string | null
}

const readyState: DocState = { status: 'ready', amount: null, message: null }

function errorMessage(error: unknown) {
  const code =
    typeof error === 'object' && error && 'code' in error
      ? String((error as { code: unknown }).code)
      : ''
  if (code.includes('permission-denied')) {
    return '목표를 보거나 저장할 권한이 없어요.'
  }
  return '목표를 불러오지 못했어요.'
}

function inputError(
  reason: 'empty' | 'invalid' | 'not-positive' | 'too-large',
) {
  if (reason === 'empty') return '목표 금액을 입력해 주세요.'
  if (reason === 'not-positive') return '0원보다 큰 금액만 저장할 수 있어요.'
  if (reason === 'too-large') return '너무 큰 금액이에요.'
  return '숫자만 입력해 주세요.'
}

export function useMonthBudget(userId: string | null | undefined, today: Date) {
  const monthKey = monthKeyFromDate(today)
  const previousKey = previousMonthKey(monthKey)
  const [current, setCurrent] = useState<DocState>({
    status: 'loading',
    amount: null,
    message: null,
  })
  const [previous, setPrevious] = useState<DocState>({
    status: 'loading',
    amount: null,
    message: null,
  })
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [retryToken, setRetryToken] = useState(0)

  useEffect(() => {
    if (!userId) {
      setCurrent(readyState)
      setPrevious(readyState)
      return
    }

    setCurrent({ status: 'loading', amount: null, message: null })
    setPrevious({ status: 'loading', amount: null, message: null })

    let currentId = ''
    let previousId = ''
    try {
      currentId = budgetDocumentId(userId, monthKey)
      previousId = budgetDocumentId(userId, previousKey)
    } catch (error) {
      console.error('Budget id error:', error)
      const message = '목표를 불러오지 못했어요.'
      setCurrent({ status: 'error', amount: null, message })
      setPrevious({ status: 'error', amount: null, message })
      return
    }

    const listen = (
      id: string,
      month: string,
      setState: (state: DocState) => void,
    ) =>
      onSnapshot(
        doc(db, 'budgets', id),
        (snapshot) => {
          const data = snapshot.exists() ? snapshot.data() : null
          setState({
            status: 'ready',
            amount: readBudgetAmount(data, userId, month),
            message: null,
          })
        },
        (error) => {
          console.error('Budget listener error:', error)
          setState({
            status: 'error',
            amount: null,
            message: errorMessage(error),
          })
        },
      )

    const unsubscribeCurrent = listen(currentId, monthKey, setCurrent)
    const unsubscribePrevious = listen(previousId, previousKey, setPrevious)

    return () => {
      unsubscribeCurrent()
      unsubscribePrevious()
    }
  }, [monthKey, previousKey, retryToken, userId])

  const save = async (raw: string) => {
    if (!userId) {
      const message = '로그인이 필요해요.'
      setSaveError(message)
      return { ok: false as const, message }
    }

    const parsed = parseGoalInput(raw)
    if (!parsed.ok) {
      const message = inputError(parsed.reason)
      setSaveError(message)
      return { ok: false as const, message }
    }

    setSaving(true)
    setSaveError(null)
    try {
      const write = buildBudgetWrite({
        authUserId: userId,
        monthKey,
        amount: parsed.amount,
      })
      await setDoc(doc(db, 'budgets', write.id), {
        ...write.data,
        updatedAt: serverTimestamp(),
      })
      return { ok: true as const }
    } catch (error) {
      console.error('Budget save error:', error)
      const message = errorMessage(error).includes('권한')
        ? errorMessage(error)
        : '목표를 저장하지 못했어요. 다시 시도해 주세요.'
      setSaveError(message)
      return { ok: false as const, message }
    } finally {
      setSaving(false)
    }
  }

  return {
    monthKey,
    previousKey,
    savedAmount: current.status === 'ready' ? current.amount : null,
    previousAmount: previous.status === 'ready' ? previous.amount : null,
    loading: current.status === 'loading' || previous.status === 'loading',
    currentError: current.status === 'error' ? current.message : null,
    previousError: previous.status === 'error' ? previous.message : null,
    saving,
    saveError,
    save,
    clearSaveError: () => setSaveError(null),
    retry: () => setRetryToken((value) => value + 1),
  }
}
