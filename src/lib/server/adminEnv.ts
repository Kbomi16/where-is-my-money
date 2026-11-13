// Firebase Admin 서비스 계정 env 읽기 (순수 함수, 요청 시점에 호출)

export const FIREBASE_ADMIN_ENV_KEYS = [
  'FIREBASE_ADMIN_PROJECT_ID',
  'FIREBASE_ADMIN_CLIENT_EMAIL',
  'FIREBASE_ADMIN_PRIVATE_KEY',
] as const

export type FirebaseAdminEnv =
  | {
      ok: true
      projectId: string
      clientEmail: string
      privateKey: string
    }
  | { ok: false; missing: string[] }

/** Vercel/.env 에 한 줄로 넣은 키의 `\n`, 감싼 따옴표를 실제 PEM 형태로 되돌린다 */
export function normalizePrivateKey(raw: string) {
  let value = raw.trim()
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1)
  }
  return value.replace(/\\n/g, '\n')
}

export function readFirebaseAdminEnv(
  env: Record<string, string | undefined>,
): FirebaseAdminEnv {
  const missing = FIREBASE_ADMIN_ENV_KEYS.filter((key) => !env[key]?.trim())
  if (missing.length > 0) return { ok: false, missing: [...missing] }
  const privateKey = normalizePrivateKey(env.FIREBASE_ADMIN_PRIVATE_KEY!)
  if (!privateKey.includes('PRIVATE KEY')) {
    return { ok: false, missing: ['FIREBASE_ADMIN_PRIVATE_KEY'] }
  }
  return {
    ok: true,
    projectId: env.FIREBASE_ADMIN_PROJECT_ID!.trim(),
    clientEmail: env.FIREBASE_ADMIN_CLIENT_EMAIL!.trim(),
    privateKey,
  }
}
