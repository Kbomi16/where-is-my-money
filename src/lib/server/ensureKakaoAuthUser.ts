import type { Auth } from 'firebase-admin/auth'
import {
  omitAuthEmail,
  planKakaoAuthUser,
  type KakaoAuthUserSnapshot,
} from '@/lib/auth/kakaoOAuth'

function errorCode(error: unknown) {
  return typeof error === 'object' && error !== null && 'code' in error
    ? String((error as { code: unknown }).code)
    : null
}

function isEmailConflict(code: string | null) {
  return (
    code === 'auth/email-already-exists' || code === 'auth/email-already-in-use'
  )
}

async function readAuthUser(
  adminAuth: Auth,
  uid: string,
): Promise<KakaoAuthUserSnapshot> {
  const record = await adminAuth.getUser(uid)
  return {
    email: record.email ?? null,
    displayName: record.displayName ?? null,
  }
}

async function applyPlan(
  adminAuth: Auth,
  uid: string,
  plan: ReturnType<typeof planKakaoAuthUser>,
  includeEmail: boolean,
) {
  if (plan.action === 'none') return
  if (plan.action === 'create') {
    const payload = includeEmail ? plan.payload : omitAuthEmail(plan.payload)
    await adminAuth.createUser(payload)
    return
  }
  const payload = includeEmail ? plan.payload : omitAuthEmail(plan.payload)
  if (Object.keys(payload).length === 0) return
  await adminAuth.updateUser(uid, payload)
}

/**
 * 카카오 uid로 Firebase Auth 사용자를 만들거나, 비어 있는 email/displayName만 채운다.
 * 이미 있는 Auth email은 바꾸지 않는다.
 * email 충돌이면 Auth에는 넣지 않고 넘어가며, 로그인 자체는 실패시키지 않는다.
 */
export async function ensureKakaoAuthUser(
  adminAuth: Auth,
  input: { uid: string; email: string | null; nickname: string | null },
) {
  let existing: KakaoAuthUserSnapshot = null
  try {
    existing = await readAuthUser(adminAuth, input.uid)
  } catch (error) {
    if (errorCode(error) !== 'auth/user-not-found') throw error
  }

  let plan = planKakaoAuthUser(existing, input)
  if (plan.action === 'none') return

  try {
    await applyPlan(adminAuth, input.uid, plan, true)
    return
  } catch (error) {
    const code = errorCode(error)
    if (code === 'auth/uid-already-exists' && plan.action === 'create') {
      const current = await readAuthUser(adminAuth, input.uid)
      plan = planKakaoAuthUser(current, input)
      if (plan.action === 'none') return
      try {
        await applyPlan(adminAuth, input.uid, plan, true)
        return
      } catch (retryError) {
        if (!isEmailConflict(errorCode(retryError))) throw retryError
        await applyPlan(adminAuth, input.uid, plan, false)
        return
      }
    }
    if (!isEmailConflict(code)) throw error
    await applyPlan(adminAuth, input.uid, plan, false)
  }
}
