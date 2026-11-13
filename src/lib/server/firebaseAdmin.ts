import { cert, getApp, getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { readFirebaseAdminEnv } from './adminEnv'

const ADMIN_APP_NAME = 'wimm-admin'

export class MissingAdminEnvError extends Error {
  readonly missing: string[]
  constructor(missing: string[]) {
    super(`Missing Firebase Admin env: ${missing.join(', ')}`)
    this.name = 'MissingAdminEnvError'
    this.missing = missing
  }
}

/**
 * 서버 전용. env를 요청 시점에 읽기 때문에 env가 없어도 `next build`는 통과한다.
 * (클라이언트 컴포넌트에서 import 하지 말 것)
 */
export function getAdminAuth() {
  const existing = getApps().find((app) => app.name === ADMIN_APP_NAME)
  if (existing) return getAuth(getApp(ADMIN_APP_NAME))

  const env = readFirebaseAdminEnv(process.env)
  if (!env.ok) throw new MissingAdminEnvError(env.missing)

  const app = initializeApp(
    {
      credential: cert({
        projectId: env.projectId,
        clientEmail: env.clientEmail,
        privateKey: env.privateKey,
      }),
      projectId: env.projectId,
    },
    ADMIN_APP_NAME,
  )
  return getAuth(app)
}
