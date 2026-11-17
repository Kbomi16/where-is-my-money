// 푸시 알림 순수 로직 (브라우저·서버 공용, Firebase SDK에 의존하지 않음)

export const PUSH_SW_PATH = '/firebase-messaging-sw.js'
// 나중에 PWA 서비스 워커(scope "/")가 생겨도 겹치지 않도록 FCM 전용 scope를 쓴다.
// (firebase/messaging이 직접 등록할 때 쓰는 기본 scope와 같은 값)
export const PUSH_SW_SCOPE = '/firebase-cloud-messaging-push-scope'
export const PUSH_DEFAULT_LINK = '/'
export const PUSH_TOKEN_MAX_LENGTH = 4096
export const PUSH_USER_AGENT_MAX_LENGTH = 300

/** 서비스 워커에 넘길 Firebase 웹 config 키 (공개 값이지만 레포에 박지 않고 쿼리스트링으로 전달) */
export const PUSH_SW_CONFIG_KEYS = [
  'apiKey',
  'authDomain',
  'projectId',
  'storageBucket',
  'messagingSenderId',
  'appId',
] as const

export type PushSwConfig = Partial<
  Record<(typeof PUSH_SW_CONFIG_KEYS)[number], string | undefined>
>

/** `/firebase-messaging-sw.js?v=<sdk>&apiKey=...` 형태의 등록 URL을 만든다. 빈 값은 빼고 넣는다. */
export function buildMessagingSwUrl(config: PushSwConfig, sdkVersion: string) {
  const params = new URLSearchParams()
  params.set('v', sdkVersion)
  for (const key of PUSH_SW_CONFIG_KEYS) {
    const value = config[key]?.trim()
    if (value) params.set(key, value)
  }
  return `${PUSH_SW_PATH}?${params.toString()}`
}

export type PushSupportInput = {
  hasNotification: boolean
  hasServiceWorker: boolean
  hasPushManager: boolean
  messagingSupported: boolean
  isIos: boolean
  isStandalone: boolean
  hasVapidKey: boolean
}

export type PushSupport =
  | { ok: true }
  | {
      ok: false
      reason: 'ios-not-installed' | 'unsupported' | 'missing-config'
      message: string
    }

/** 이 브라우저에서 웹 푸시를 켤 수 있는지 판단한다. iOS는 홈 화면에 추가한 PWA에서만 웹 푸시가 된다. */
export function resolvePushSupport(input: PushSupportInput): PushSupport {
  if (input.isIos && !input.isStandalone) {
    return {
      ok: false,
      reason: 'ios-not-installed',
      message:
        '아이폰·아이패드는 Safari 공유 버튼 → 「홈 화면에 추가」로 설치한 앱에서 켤 수 있어요.',
    }
  }
  if (
    !input.hasNotification ||
    !input.hasServiceWorker ||
    !input.hasPushManager ||
    !input.messagingSupported
  ) {
    return {
      ok: false,
      reason: 'unsupported',
      message: '이 브라우저는 푸시 알림을 지원하지 않아요.',
    }
  }
  if (!input.hasVapidKey) {
    return {
      ok: false,
      reason: 'missing-config',
      message: '푸시 알림 설정(VAPID 키)이 아직 없어요.',
    }
  }
  return { ok: true }
}

/** UA 문자열로 iOS/iPadOS 여부 판단 (iPadOS 13+는 Mac UA + 터치 지원으로 구분) */
export function isIosUserAgent(userAgent: string, maxTouchPoints = 0) {
  if (/iPad|iPhone|iPod/.test(userAgent)) return true
  return /Macintosh/.test(userAgent) && maxTouchPoints > 1
}

export type PushDisplay = {
  title: string
  body: string
  link: string
  tag?: string
}

/**
 * 서버가 보낸 data 전용 메시지 → 화면에 띄울 알림. 제목이 없으면 null.
 * (포그라운드 onMessage에서 사용. public/firebase-messaging-sw.js 백그라운드 처리와 같은 규칙)
 */
export function readPushDisplay(data: Record<string, string> | undefined | null): PushDisplay | null {
  const title = data?.title?.trim()
  if (!title) return null
  const link = data?.link?.startsWith('/') && !data.link.startsWith('//') ? data.link : PUSH_DEFAULT_LINK
  const tag = data?.tag?.trim()
  return { title, body: data?.body ?? '', link, ...(tag ? { tag } : {}) }
}

/** FCM 응답 에러 중 토큰을 지워야 하는 것 (Firebase 문서 기준 두 가지만) */
const INVALID_TOKEN_CODES = new Set([
  'messaging/registration-token-not-registered',
  'messaging/invalid-registration-token',
])

export function isInvalidTokenError(code: string | null | undefined) {
  return !!code && INVALID_TOKEN_CODES.has(code)
}

export type SendResultLike = {
  success: boolean
  error?: { code?: string } | null
}

/** sendEachForMulticast 결과에서 정리할(무효) 토큰만 골라낸다. responses 순서 = tokens 순서 */
export function collectInvalidTokens(
  tokens: readonly string[],
  responses: readonly SendResultLike[],
) {
  return tokens.filter((_, index) => {
    const response = responses[index]
    return !!response && !response.success && isInvalidTokenError(response.error?.code)
  })
}

/** API로 받은 FCM 토큰 형식 검사 (공백 없는 1~4096자 문자열) */
export function parsePushToken(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const token = value.trim()
  if (!token || token.length > PUSH_TOKEN_MAX_LENGTH || /\s/.test(token)) {
    return null
  }
  return token
}

export function clampUserAgent(value: string | null | undefined) {
  return (value ?? '').slice(0, PUSH_USER_AGENT_MAX_LENGTH)
}

/** `Authorization: Bearer <idToken>` 에서 토큰만 꺼낸다 */
export function readBearerToken(header: string | null | undefined) {
  const match = /^Bearer\s+(\S+)$/i.exec(header?.trim() ?? '')
  return match ? match[1] : null
}

export function pushTokenStorageKey(uid: string) {
  return `push-token:${uid}`
}
