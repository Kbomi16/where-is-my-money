import type { NextRequest } from 'next/server'
import { clampUserAgent, parsePushToken } from '@/lib/push/pushCore'
import { deletePushToken, savePushToken } from '@/lib/server/pushTokens'
import { jsonNoStore, readJsonBody, verifyRequestUser } from '@/lib/server/verifyRequestUser'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// 푸시 토큰 저장 (Firestore 규칙 배포 없이 Admin SDK로 users/{uid}/fcmTokens 에 씀)
export async function POST(request: NextRequest) {
  const user = await verifyRequestUser(request)
  if (!user.ok) return user.response

  const token = parsePushToken((await readJsonBody(request)).token)
  if (!token) return jsonNoStore({ error: 'invalid_token' }, 400)

  try {
    await savePushToken(user.uid, token, clampUserAgent(request.headers.get('user-agent')))
    return jsonNoStore({ ok: true }, 200)
  } catch (error) {
    console.error('[push] 토큰 저장 실패', error)
    return jsonNoStore({ error: 'save_failed' }, 500)
  }
}

export async function DELETE(request: NextRequest) {
  const user = await verifyRequestUser(request)
  if (!user.ok) return user.response

  const token = parsePushToken((await readJsonBody(request)).token)
  if (!token) return jsonNoStore({ error: 'invalid_token' }, 400)

  try {
    await deletePushToken(user.uid, token)
    return jsonNoStore({ ok: true }, 200)
  } catch (error) {
    console.error('[push] 토큰 삭제 실패', error)
    return jsonNoStore({ error: 'delete_failed' }, 500)
  }
}
