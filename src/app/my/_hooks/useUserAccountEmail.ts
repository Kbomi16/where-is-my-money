'use client'

import { useEffect, useState } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'

/** users/{uid} 문서의 email. Auth email이 없을 때(카카오 등) 프로필 표시용 */
export function useUserAccountEmail(userId: string | null | undefined) {
  const [state, setState] = useState<{ loading: boolean; email: string | null }>(
    {
      loading: Boolean(userId),
      email: null,
    },
  )

  useEffect(() => {
    if (!userId) {
      setState({ loading: false, email: null })
      return
    }

    setState({ loading: true, email: null })
    const unsubscribe = onSnapshot(
      doc(db, 'users', userId),
      (snapshot) => {
        const raw = snapshot.exists() ? snapshot.data()?.email : null
        const email = typeof raw === 'string' && raw.trim() ? raw.trim() : null
        setState({ loading: false, email })
      },
      () => {
        setState({ loading: false, email: null })
      },
    )

    return unsubscribe
  }, [userId])

  return state
}
