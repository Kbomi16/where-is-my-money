import { Timestamp } from 'firebase-admin/firestore'
import {
  REMINDER_MAX_DELAY_MS,
  buildReminderMessage,
  formatKst,
  redactUid,
  resolveReminderSlot,
  type ReminderSlotId,
} from '@/lib/push/reminderCore'
import { getAdminFirestore } from './firebaseAdmin'
import { sendToTokens } from './pushTokens'

export type RunRemindersOptions = {
  now?: Date
  /** 로컬 테스트용 슬롯 강제 지정 (지정하면 지연 시간 검사도 건너뜀) */
  slot?: ReminderSlotId | null
  /** 보낼 대상만 계산하고 발송·중복 방지 기록은 하지 않음 */
  dryRun?: boolean
  /** 이미 이 슬롯에 보냈어도 다시 보냄 */
  force?: boolean
}

type UserResult = {
  uid: string
  tokens: number
  status: 'would_send' | 'sent' | 'already_sent' | 'failed'
  successCount?: number
  failureCount?: number
  removed?: number
}

function reminderStateRef(uid: string) {
  // users/{uid} 프로필 문서는 건드리지 않고 하위 문서에 중복 방지 키를 둔다 (Admin SDK 전용)
  return getAdminFirestore().collection('users').doc(uid).collection('pushState').doc('reminder')
}

/** 알림을 켠 사용자(uid → 토큰 목록). 필터 없는 collectionGroup 조회라 색인이 필요 없다 */
async function loadTokensByUid() {
  const snap = await getAdminFirestore().collectionGroup('fcmTokens').get()
  const map = new Map<string, string[]>()
  for (const doc of snap.docs) {
    const userRef = doc.ref.parent.parent
    if (!userRef || userRef.parent.id !== 'users') continue
    const token = doc.get('token')
    if (typeof token !== 'string' || !token) continue
    const list = map.get(userRef.id) ?? []
    list.push(token)
    map.set(userRef.id, list)
  }
  return map
}

/**
 * 구간 안에 직접 기록한 사용자 uid.
 * createdAt 단일 필드 범위 조회 한 번으로 끝낸다 (userId+createdAt 복합 색인 불필요).
 * 앱이 자동으로 만든 반복 지출 회차(recurringParentId 있음)는 「직접 기록」으로 치지 않는다.
 */
async function loadRecordedUids(fromMs: number, toMs: number) {
  const snap = await getAdminFirestore()
    .collection('transactions')
    .where('createdAt', '>=', Timestamp.fromMillis(fromMs))
    .where('createdAt', '<=', Timestamp.fromMillis(toMs))
    .select('userId', 'recurringParentId')
    .get()
  const set = new Set<string>()
  for (const doc of snap.docs) {
    const userId = doc.get('userId')
    if (typeof userId === 'string' && !doc.get('recurringParentId')) set.add(userId)
  }
  return { uids: set, scanned: snap.size }
}

/** 이 슬롯 발송권을 트랜잭션으로 선점. 이미 같은 slotKey면 false (크론 중복 실행 대비) */
async function claimSlot(uid: string, slotKey: string, force: boolean) {
  const ref = reminderStateRef(uid)
  return getAdminFirestore().runTransaction(async (tx) => {
    const snap = await tx.get(ref)
    if (!force && snap.get('lastSlotKey') === slotKey) return false
    tx.set(ref, { lastSlotKey: slotKey, sentAt: Timestamp.now() }, { merge: true })
    return true
  })
}

export async function runReminders(options: RunRemindersOptions = {}) {
  const now = options.now ?? new Date()
  const dryRun = !!options.dryRun
  const force = !!options.force
  const instance = resolveReminderSlot(now, options.slot)
  const message = buildReminderMessage(instance)
  const base = {
    slot: instance.slot,
    slotKey: instance.slotKey,
    window: { fromKst: formatKst(instance.windowStartMs), toKst: formatKst(now.getTime()) },
    dryRun,
    force,
  }

  if (!options.slot && now.getTime() - instance.startMs > REMINDER_MAX_DELAY_MS) {
    return { ...base, status: 'skipped' as const, reason: 'outside_slot' as const, users: [] }
  }

  const tokensByUid = await loadTokensByUid()
  const recorded = await loadRecordedUids(instance.windowStartMs, now.getTime())

  const users: UserResult[] = []
  let recordedCount = 0
  for (const [uid, tokens] of tokensByUid) {
    if (recorded.uids.has(uid)) {
      recordedCount += 1
      continue
    }
    const shown = redactUid(uid)
    if (dryRun) {
      const state = await reminderStateRef(uid).get()
      const already = !force && state.get('lastSlotKey') === instance.slotKey
      users.push({ uid: shown, tokens: tokens.length, status: already ? 'already_sent' : 'would_send' })
      continue
    }
    try {
      if (!(await claimSlot(uid, instance.slotKey, force))) {
        users.push({ uid: shown, tokens: tokens.length, status: 'already_sent' })
        continue
      }
      const result = await sendToTokens(uid, tokens, message)
      users.push({ uid: shown, tokens: tokens.length, status: 'sent', ...result })
    } catch (error) {
      console.error('[reminder] 발송 실패', shown, error)
      users.push({ uid: shown, tokens: tokens.length, status: 'failed' })
    }
  }

  return {
    ...base,
    status: 'ok' as const,
    usersWithTokens: tokensByUid.size,
    recordedInWindow: recordedCount,
    transactionsScanned: recorded.scanned,
    users,
  }
}
