import { FieldValue } from 'firebase-admin/firestore'
import { collectInvalidTokens } from '@/lib/push/pushCore'
import { pushTokenDocId } from '@/lib/push/pushTokenId'
import { getAdminFirestore, getAdminMessaging } from './firebaseAdmin'

const MAX_TOKENS_PER_USER = 20

function tokensCollection(uid: string) {
  return getAdminFirestore().collection('users').doc(uid).collection('fcmTokens')
}

/** users/{uid}/fcmTokens/{sha256(token)} 에 upsert. createdAt은 처음 한 번만 */
export async function savePushToken(uid: string, token: string, userAgent: string) {
  const ref = tokensCollection(uid).doc(pushTokenDocId(token))
  await getAdminFirestore().runTransaction(async (tx) => {
    const snap = await tx.get(ref)
    tx.set(
      ref,
      {
        token,
        userAgent,
        updatedAt: FieldValue.serverTimestamp(),
        ...(snap.exists ? {} : { createdAt: FieldValue.serverTimestamp() }),
      },
      { merge: true },
    )
  })
}

export async function deletePushToken(uid: string, token: string) {
  await tokensCollection(uid).doc(pushTokenDocId(token)).delete()
}

export type PushData = {
  title: string
  body: string
  link: string
  tag: string
}

export type SendToTokensResult = {
  successCount: number
  failureCount: number
  removed: number
}

/**
 * 한 사용자의 토큰들로 data 전용 메시지를 보내고, 무효 토큰은 문서를 지운다.
 * notification 필드를 같이 넣으면 SDK 자동 표시 + 우리 표시로 두 번 뜰 수 있어서 data만 보낸다.
 * (백그라운드: public/firebase-messaging-sw.js onBackgroundMessage, 포그라운드: pushClient onMessage)
 */
export async function sendToTokens(
  uid: string,
  tokens: readonly string[],
  data: PushData,
): Promise<SendToTokensResult> {
  const list = tokens.slice(0, MAX_TOKENS_PER_USER)
  if (list.length === 0) return { successCount: 0, failureCount: 0, removed: 0 }

  const response = await getAdminMessaging().sendEachForMulticast({
    tokens: list,
    data,
    // 리마인더는 다음 슬롯(최대 14시간 뒤) 전까지만 의미가 있어서 TTL을 짧게
    webpush: { headers: { Urgency: 'high', TTL: String(4 * 60 * 60) } },
  })

  const invalid = collectInvalidTokens(
    list,
    response.responses.map((item) => ({ success: item.success, error: item.error ?? null })),
  )
  if (invalid.length > 0) {
    const batch = getAdminFirestore().batch()
    for (const token of invalid) batch.delete(tokensCollection(uid).doc(pushTokenDocId(token)))
    await batch.commit()
  }

  return {
    successCount: response.successCount,
    failureCount: response.failureCount,
    removed: invalid.length,
  }
}
