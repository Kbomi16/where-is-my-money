// 서버 전용: FCM 토큰 → Firestore 문서 ID (토큰 원문은 길고 '/' 같은 문자가 섞일 수 있어 해시를 ID로 쓴다)
import { createHash } from 'node:crypto'

export function pushTokenDocId(token: string) {
  return createHash('sha256').update(token, 'utf8').digest('hex')
}
