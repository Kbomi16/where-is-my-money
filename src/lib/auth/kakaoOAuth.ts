// 카카오 OAuth 순수 로직 (서버 라우트와 클라이언트 완료 페이지가 함께 사용)

export const KAKAO_AUTHORIZE_URL = 'https://kauth.kakao.com/oauth/authorize'
export const KAKAO_TOKEN_URL = 'https://kauth.kakao.com/oauth/token'
export const KAKAO_USER_URL = 'https://kapi.kakao.com/v2/user/me'
export const KAKAO_CALLBACK_PATH = '/api/auth/kakao/callback'
export const KAKAO_COMPLETE_PATH = '/auth/kakao'
export const KAKAO_STATE_COOKIE = 'wimm_kakao_oauth'
export const KAKAO_STATE_COOKIE_PATH = '/api/auth/kakao'
export const KAKAO_STATE_TTL_SECONDS = 10 * 60
export const KAKAO_UID_PREFIX = 'kakao:'

const MIN_STATE_LENGTH = 32

/** 카카오 회원번호 → Firebase uid (결정적 매핑, 이메일과 무관) */
export function kakaoFirebaseUid(kakaoId: string | number) {
  const id = String(kakaoId)
  if (!/^\d{1,20}$/.test(id)) {
    throw new Error('Invalid Kakao user id')
  }
  return `${KAKAO_UID_PREFIX}${id}`
}

export function isKakaoUid(uid: string | null | undefined) {
  return typeof uid === 'string' && uid.startsWith(KAKAO_UID_PREFIX)
}

/** 로그인 후 돌아갈 경로. 외부 주소(open redirect)·인증 화면은 막고 '/'로 */
export function sanitizeNextPath(next: string | null | undefined) {
  if (typeof next !== 'string' || next.length === 0 || next.length > 200) {
    return '/'
  }
  if (!next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) {
    return '/'
  }
  if (/[\u0000-\u001f\\]/.test(next)) return '/'
  if (
    next === '/login' ||
    next === '/signup' ||
    next.startsWith('/login?') ||
    next.startsWith('/signup?') ||
    next.startsWith('/auth/') ||
    next.startsWith('/api/')
  ) {
    return '/'
  }
  return next
}

export function resolveKakaoRedirectUri(
  configured: string | null | undefined,
  requestOrigin: string,
) {
  const value = configured?.trim()
  if (value) {
    try {
      const url = new URL(value)
      if (url.protocol === 'http:' || url.protocol === 'https:') {
        return url.toString()
      }
    } catch {
      // 잘못된 값이면 요청 주소 기준으로 만든다
    }
  }
  return new URL(KAKAO_CALLBACK_PATH, requestOrigin).toString()
}

export function buildKakaoAuthorizeUrl(input: {
  clientId: string
  redirectUri: string
  state: string
}) {
  const url = new URL(KAKAO_AUTHORIZE_URL)
  url.searchParams.set('client_id', input.clientId)
  url.searchParams.set('redirect_uri', input.redirectUri)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('state', input.state)
  return url.toString()
}

export function buildKakaoTokenRequestBody(input: {
  clientId: string
  redirectUri: string
  code: string
  clientSecret?: string | null
}) {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: input.clientId,
    redirect_uri: input.redirectUri,
    code: input.code,
  })
  if (input.clientSecret) body.set('client_secret', input.clientSecret)
  return body.toString()
}

/** state 쿠키: `<state>.<encodeURIComponent(next)>` */
export function encodeStateCookie(state: string, next: string) {
  return `${state}.${encodeURIComponent(sanitizeNextPath(next))}`
}

export function decodeStateCookie(value: string | null | undefined) {
  if (!value) return null
  const dot = value.indexOf('.')
  if (dot <= 0) return null
  const state = value.slice(0, dot)
  if (!/^[A-Za-z0-9_-]+$/.test(state) || state.length < MIN_STATE_LENGTH) {
    return null
  }
  let next = '/'
  try {
    next = sanitizeNextPath(decodeURIComponent(value.slice(dot + 1)))
  } catch {
    next = '/'
  }
  return { state, next }
}

/** CSRF 방지: 쿠키에 저장한 state와 카카오가 돌려준 state 비교 (길이 같을 때 상수 시간) */
export function statesMatch(
  expected: string | null | undefined,
  received: string | null | undefined,
) {
  if (typeof expected !== 'string' || typeof received !== 'string') return false
  if (expected.length < MIN_STATE_LENGTH) return false
  if (expected.length !== received.length) return false
  let diff = 0
  for (let i = 0; i < expected.length; i += 1) {
    diff |= expected.charCodeAt(i) ^ received.charCodeAt(i)
  }
  return diff === 0
}

export type KakaoProfile = {
  id: string
  nickname: string | null
  /** 검증된 카카오 이메일. 프로필 필드로만 쓰고, 기존 계정 병합 기준으로는 쓰지 않는다 */
  email: string | null
}

const PROFILE_EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** 프로필로 쓸 이메일만 통과시킨다. 병합·계정 조회에는 쓰지 말 것 */
export function sanitizeProfileEmail(value: string | null | undefined) {
  if (typeof value !== 'string') return null
  const email = value.trim()
  if (!email || email.length > 254) return null
  if (!PROFILE_EMAIL_RE.test(email)) return null
  return email
}

/**
 * kakao_account.email은 is_email_valid === true 이고 is_email_verified === true 일 때만 사용.
 * 동의 항목이 꺼져 kakao_account나 필드가 없어도 깨지지 않고 null을 돌려준다.
 */
export function extractKakaoAccountEmail(kakaoAccount: unknown): string | null {
  if (typeof kakaoAccount !== 'object' || kakaoAccount === null) return null
  const account = kakaoAccount as {
    email?: unknown
    is_email_valid?: unknown
    is_email_verified?: unknown
  }
  if (account.is_email_valid !== true || account.is_email_verified !== true) {
    return null
  }
  return typeof account.email === 'string'
    ? sanitizeProfileEmail(account.email)
    : null
}

/** /v2/user/me 응답에서 필요한 값만 꺼낸다. 이메일은 검증된 경우에만 프로필로 쓴다(병합 기준 아님) */
export function parseKakaoProfile(json: unknown): KakaoProfile | null {
  if (typeof json !== 'object' || json === null) return null
  const data = json as {
    id?: unknown
    kakao_account?: unknown
    properties?: { nickname?: unknown }
  }
  const rawId = data.id
  let id: string | null = null
  if (typeof rawId === 'number' && Number.isSafeInteger(rawId) && rawId > 0) {
    id = String(rawId)
  } else if (typeof rawId === 'string' && /^\d{1,20}$/.test(rawId)) {
    id = rawId
  }
  if (!id) return null

  const account =
    typeof data.kakao_account === 'object' && data.kakao_account !== null
      ? (data.kakao_account as { profile?: { nickname?: unknown } })
      : null
  const nicknameCandidate = account?.profile?.nickname ?? data.properties?.nickname
  const nickname =
    typeof nicknameCandidate === 'string' && nicknameCandidate.trim()
      ? nicknameCandidate.trim().slice(0, 20)
      : null

  return { id, nickname, email: extractKakaoAccountEmail(data.kakao_account) }
}

export type KakaoAuthUserSnapshot = {
  email?: string | null
  displayName?: string | null
} | null

export type KakaoAuthUserPlan =
  | { action: 'none' }
  | {
      action: 'create'
      payload: {
        uid: string
        email?: string
        emailVerified?: boolean
        displayName?: string
      }
    }
  | {
      action: 'update'
      payload: {
        email?: string
        emailVerified?: boolean
        displayName?: string
      }
    }

function isBlank(value: string | null | undefined) {
  return !value || value.trim() === ''
}

/**
 * Firebase Auth 사용자를 만들거나, 비어 있는 email/displayName만 채운다.
 * 이미 있는 Auth email은 바꾸지 않는다. 실제 충돌(email-already-exists) 처리는 서버 IO에서 한다.
 */
export function planKakaoAuthUser(
  existing: KakaoAuthUserSnapshot,
  input: { uid: string; email: string | null; nickname: string | null },
): KakaoAuthUserPlan {
  const email = sanitizeProfileEmail(input.email)
  const displayName =
    typeof input.nickname === 'string' && input.nickname.trim()
      ? input.nickname.trim().slice(0, 20)
      : undefined

  if (!existing) {
    const payload: Extract<KakaoAuthUserPlan, { action: 'create' }>['payload'] =
      { uid: input.uid }
    if (email) {
      payload.email = email
      payload.emailVerified = true
    }
    if (displayName) payload.displayName = displayName
    return { action: 'create', payload }
  }

  const payload: Extract<KakaoAuthUserPlan, { action: 'update' }>['payload'] = {}
  if (isBlank(existing.email) && email) {
    payload.email = email
    payload.emailVerified = true
  }
  if (isBlank(existing.displayName) && displayName) {
    payload.displayName = displayName
  }
  if (payload.email === undefined && payload.displayName === undefined) {
    return { action: 'none' }
  }
  return { action: 'update', payload }
}

/** email 충돌 시 create/update payload에서 이메일만 빼고 재시도할 때 사용 */
export function omitAuthEmail<T extends { email?: string; emailVerified?: boolean }>(
  payload: T,
): Omit<T, 'email' | 'emailVerified'> {
  const { email: _email, emailVerified: _verified, ...rest } = payload
  return rest
}

/**
 * 서버 콜백 → 클라이언트 완료 페이지로 custom token 전달.
 * URL fragment(#)는 서버로 전송되지 않아 서버·프록시 로그에 남지 않고,
 * 완료 페이지에서 읽은 즉시 history에서 지운다.
 */
export function encodeCompleteFragment(input: {
  token: string
  next: string
  nickname: string | null
  email?: string | null
}) {
  const params = new URLSearchParams({
    token: input.token,
    next: sanitizeNextPath(input.next),
  })
  if (input.nickname) params.set('nickname', input.nickname)
  const email = sanitizeProfileEmail(input.email)
  if (email) params.set('email', email)
  return `#${params.toString()}`
}

export function parseCompleteFragment(hash: string | null | undefined) {
  if (!hash) return null
  const params = new URLSearchParams(hash.startsWith('#') ? hash.slice(1) : hash)
  const token = params.get('token')
  if (!token || !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token)) {
    return null
  }
  const nickname = params.get('nickname')
  return {
    token,
    next: sanitizeNextPath(params.get('next')),
    nickname: nickname && nickname.trim() ? nickname.trim().slice(0, 20) : null,
    email: sanitizeProfileEmail(params.get('email')),
  }
}
