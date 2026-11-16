// 시간대별 기록 리마인더 순수 로직 (서버·테스트 공용, Firebase SDK에 의존하지 않음)
// 시간·문구를 바꾸려면 이 파일의 REMINDER_SLOTS / REMINDER_COPY 만 고치면 된다.
// (vercel.json crons 의 UTC 시각도 같이 맞출 것: KST = UTC + 9)

export type ReminderSlotId = 'morning' | 'lunch' | 'evening'

/** KST 기준 발송 시각(정시). 순서 = 하루 안의 시간 순 */
export const REMINDER_SLOTS: readonly { id: ReminderSlotId; hour: number }[] = [
  { id: 'morning', hour: 9 },
  { id: 'lunch', hour: 13 },
  { id: 'evening', hour: 19 },
]

/** 알림 문구 (보미님 확정 문구) */
export const REMINDER_COPY: Record<ReminderSlotId, { title: string; body: string }> = {
  morning: { title: '☀️ 좋은 아침! 벌써 뭐 샀어요?', body: '커피값도 소중하니까 살짝 남겨 둬요 ☕' },
  lunch: { title: '🍚 점심 맛있게 먹었어요?', body: '얼마였는지 까먹기 전에 콕 기록해요!' },
  evening: { title: '🌙 오늘 내 돈 어디 갔지?', body: '오늘 쓴 돈, 자기 전에 정리해 볼까요?' },
}

/** 알림을 누르면 열 화면 (홈: 오른쪽 아래 + 버튼으로 바로 기록) */
export const REMINDER_LINK = '/'

/**
 * Vercel Hobby 크론은 정시~59분 사이 아무 때나 실행된다.
 * 슬롯 시작 후 이 시간보다 늦게 불리면(수동 호출·재시도 등) 보내지 않는다. ?slot= 으로 지정하면 무시.
 */
export const REMINDER_MAX_DELAY_MS = 3 * 60 * 60 * 1000

const HOUR_MS = 60 * 60 * 1000
const DAY_MS = 24 * HOUR_MS
const KST_OFFSET_MS = 9 * HOUR_MS

export type ReminderSlotInstance = {
  slot: ReminderSlotId
  /** KST 날짜 yyyy-MM-dd */
  dateKey: string
  /** 중복 방지 키 `2026-11-16:lunch` */
  slotKey: string
  /** 이 슬롯 시작 시각 (UTC ms) */
  startMs: number
  /** 기록 확인 구간 시작 = 직전 슬롯 시작 시각 (UTC ms). 아침이면 전날 19시 */
  windowStartMs: number
}

/** UTC ms → KST 날짜 문자열 */
export function kstDateKey(utcMs: number) {
  return new Date(utcMs + KST_OFFSET_MS).toISOString().slice(0, 10)
}

/** UTC ms → `2026-11-16 13:00` (KST) 표시용 */
export function formatKst(utcMs: number) {
  return new Date(utcMs + KST_OFFSET_MS).toISOString().slice(0, 16).replace('T', ' ')
}

/** now 기준 그제~오늘의 모든 슬롯 시작 시각 (오름차순) */
function recentSlotStarts(nowMs: number) {
  const kstDayStartUtc = Math.floor((nowMs + KST_OFFSET_MS) / DAY_MS) * DAY_MS - KST_OFFSET_MS
  const list: { slot: ReminderSlotId; startMs: number }[] = []
  for (const daysAgo of [2, 1, 0]) {
    for (const { id, hour } of REMINDER_SLOTS) {
      list.push({ slot: id, startMs: kstDayStartUtc - daysAgo * DAY_MS + hour * HOUR_MS })
    }
  }
  return list
}

/**
 * 지금 보낼 슬롯을 정한다: 시작 시각 <= now 인 가장 최근 슬롯.
 * override를 주면 그 슬롯의 가장 최근 시작(오늘 아직 안 됐으면 어제)을 쓴다.
 * 기록 확인 구간은 그 슬롯 바로 앞 슬롯 시작 ~ now.
 */
export function resolveReminderSlot(now: Date, override?: ReminderSlotId | null): ReminderSlotInstance {
  const nowMs = now.getTime()
  const list = recentSlotStarts(nowMs)
  let index = -1
  for (let i = list.length - 1; i >= 0; i -= 1) {
    if (list[i].startMs <= nowMs && (!override || list[i].slot === override)) {
      index = i
      break
    }
  }
  // 그제 첫 슬롯 이후 항상 하나는 있으므로 index >= 1 이 보장된다
  const current = list[index]
  const previous = list[index - 1]
  const dateKey = kstDateKey(current.startMs)
  return {
    slot: current.slot,
    dateKey,
    slotKey: `${dateKey}:${current.slot}`,
    startMs: current.startMs,
    windowStartMs: previous.startMs,
  }
}

export type ReminderMessage = {
  title: string
  body: string
  link: string
  /** 같은 슬롯 알림은 여러 탭·기기에서 겹쳐도 하나로 합쳐지게 tag를 고정 */
  tag: string
}

export function buildReminderMessage(instance: Pick<ReminderSlotInstance, 'slot' | 'slotKey'>): ReminderMessage {
  const copy = REMINDER_COPY[instance.slot]
  return { title: copy.title, body: copy.body, link: REMINDER_LINK, tag: `reminder:${instance.slotKey}` }
}

export function parseReminderSlot(value: string | null | undefined): ReminderSlotId | null {
  return value === 'morning' || value === 'lunch' || value === 'evening' ? value : null
}

export function parseFlag(value: string | null | undefined) {
  return value === '1' || value === 'true'
}

/**
 * Vercel Cron 표준: `Authorization: Bearer ${CRON_SECRET}`.
 * 시크릿이 비어 있으면 항상 거부한다. 길이만 같으면 끝까지 비교(타이밍 차이 줄이기).
 */
export function isCronAuthorized(header: string | null | undefined, secret: string | null | undefined) {
  const expectedSecret = secret?.trim() ?? ''
  if (!expectedSecret || !header) return false
  const expected = `Bearer ${expectedSecret}`
  if (header.length !== expected.length) return false
  let diff = 0
  for (let i = 0; i < expected.length; i += 1) diff |= header.charCodeAt(i) ^ expected.charCodeAt(i)
  return diff === 0
}

/** 로그·응답용: uid 앞 4자만 */
export function redactUid(uid: string) {
  return `${uid.slice(0, 4)}…`
}
