'use client'

import { useEffect, useState } from 'react'
import { doc, onSnapshot, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore'
import type { CategoryKind } from '@/app/constants/categories'
import { db } from '@/lib/firebase'
import {
  emptyCategoryOverrides,
  readCategoryOverrides,
  withCategoryOverride,
  type CategoryOverrides,
} from '../_lib/categoryPreference'

const permissionMessage = '카테고리를 바꾸거나 볼 권한이 없어요.'
const saveMessage = '카테고리를 저장하지 못했어요. 다시 시도해 주세요.'

const errorMessage = (error: unknown, fallback: string) => {
  const code =
    typeof error === 'object' && error && 'code' in error
      ? String((error as { code: unknown }).code)
      : ''
  if (code.includes('permission-denied')) return permissionMessage
  return fallback
}

export const useCategoryPreference = (userId: string | null | undefined) => {
  const [overrides, setOverrides] = useState<CategoryOverrides>(
    emptyCategoryOverrides(),
  )
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [savingKey, setSavingKey] = useState<string | null>(null)
  const [retryToken, setRetryToken] = useState(0)

  useEffect(() => {
    if (!userId) {
      setOverrides(emptyCategoryOverrides())
      setLoading(false)
      setError(null)
      return
    }

    setLoading(true)
    const unsubscribe = onSnapshot(
      doc(db, 'users', userId),
      (snapshot) => {
        const value = snapshot.exists()
          ? snapshot.data().categoryOverrides
          : null
        setOverrides(readCategoryOverrides(value))
        setLoading(false)
        setError(null)
      },
      (listenerError) => {
        console.error('Category preference listener error:', listenerError)
        setLoading(false)
        setError(errorMessage(listenerError, '카테고리를 불러오지 못했어요.'))
      },
    )

    return unsubscribe
  }, [retryToken, userId])

  const setEnabled = async (
    kind: CategoryKind,
    name: string,
    enabled: boolean,
  ) => {
    if (!userId) {
      setError('로그인이 필요해요.')
      return { ok: false as const }
    }

    const previous = overrides
    const next = withCategoryOverride(overrides, kind, name, enabled)
    if (next === previous) return { ok: true as const }

    setSavingKey(`${kind}:${name}`)
    setOverrides(next)
    setError(null)

    try {
      const userRef = doc(db, 'users', userId)
      const payload = {
        categoryOverrides: next,
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
        await setDoc(userRef, { uid: userId, ...payload }, { merge: true })
      }
      return { ok: true as const }
    } catch (error) {
      console.error('Category preference save error:', error)
      setOverrides(previous)
      setError(errorMessage(error, saveMessage))
      return { ok: false as const }
    } finally {
      setSavingKey(null)
    }
  }

  return {
    overrides,
    loading,
    error,
    savingKey,
    setEnabled,
    retry: () => setRetryToken((value) => value + 1),
  }
}
