import { NextResponse, type NextRequest } from 'next/server'
import { readBearerToken } from '@/lib/push/pushCore'
import { MissingAdminEnvError, getAdminAuth } from './firebaseAdmin'

export type VerifiedRequestUser =
  | { ok: true; uid: string }
  | { ok: false; response: NextResponse }

export function jsonNoStore(body: unknown, status: number) {
  const response = NextResponse.json(body, { status })
  response.headers.set('Cache-Control', 'no-store')
  return response
}

/**
 * `Authorization: Bearer <Firebase ID 토큰>`을 Admin SDK로 검증한다.
 * 헤더가 없으면 Admin env를 읽기 전에 바로 401.
 */
export async function verifyRequestUser(
  request: NextRequest,
): Promise<VerifiedRequestUser> {
  const idToken = readBearerToken(request.headers.get('authorization'))
  if (!idToken) {
    return { ok: false, response: jsonNoStore({ error: 'unauthorized' }, 401) }
  }
  try {
    const decoded = await getAdminAuth().verifyIdToken(idToken)
    return { ok: true, uid: decoded.uid }
  } catch (error) {
    if (error instanceof MissingAdminEnvError) {
      console.error('[push] Firebase Admin env 없음:', error.missing.join(', '))
      return { ok: false, response: jsonNoStore({ error: 'push_config' }, 503) }
    }
    return { ok: false, response: jsonNoStore({ error: 'unauthorized' }, 401) }
  }
}

export async function readJsonBody(request: NextRequest) {
  try {
    const body: unknown = await request.json()
    return body && typeof body === 'object' ? (body as Record<string, unknown>) : {}
  } catch {
    return {}
  }
}
