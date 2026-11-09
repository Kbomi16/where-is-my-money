'use client'

import { useEffect, useState } from 'react'
import {
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import {
  monthKeyFromDate,
  parseGoalInput,
  previousMonthKey,
  readMonthGoal,
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

    const unsubscribe = onSnapshot(
      doc(db, 'users', userId),
      (snapshot) => {
        const goals = snapshot.exists() ? snapshot.data().monthGoals : null
        setCurrent({
          status: 'ready',
          amount: readMonthGoal(goals, monthKey),
          message: null,
        })
        setPrevious({
          status: 'ready',
          amount: readMonthGoal(goals, previousKey),
          message: null,
        })
      },
      (error) => {
        console.error('Budget listener error:', error)
        const message = errorMessage(error)
        setCurrent({ status: 'error', amount: null, message })
        setPrevious({ status: 'error', amount: null, message })
      },
    )

    return unsubscribe
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
      const userRef = doc(db, 'users', userId)
      const payload = {
        [`monthGoals.${monthKey}`]: parsed.amount,
        updatedAt: serverTimestamp(),
      }
      try {
        await updateDoc(userRef, payload)
      } catch (error) {
        const code =
          typeof error === 'object' && error && 'code' in error
            ? String((error as { code: unknown }).code)
            : ''
        if (!code.includes('not-found')) throw error
        await setDoc(
          userRef,
          {
            uid: userId,
            monthGoals: { [monthKey]: parsed.amount },
            updatedAt: serverTimestamp(),
          },
          { merge: true },
        )
      }
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
