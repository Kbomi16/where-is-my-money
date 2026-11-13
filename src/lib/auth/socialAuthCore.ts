// 소셜 로그인 공통 순수 로직 (브라우저·서버·node test 어디서나 import 가능하도록 외부 의존성 없음)

export type SocialAuthErrorKind =
  | 'cancelled'
  | 'redirect-fallback'
  | 'account-exists'
  | 'error'

export type SocialAuthErrorInfo = {
  kind: SocialAuthErrorKind
  /** 사용자에게 보여줄 문구. 취소처럼 조용히 넘어갈 때는 null */
  message: string | null
}

export const DEFAULT_GHOST_PHOTO = 'ghost_1'
export const PENDING_LINK_TTL_MS = 10 * 60 * 1000
export const MAX_NICKNAME_LENGTH = 20

const PROVIDER_LABELS: Record<string, string> = {
  password: '이메일',
  emailLink: '이메일',
  'google.com': '구글',
  kakao: '카카오',
}

export function providerLabel(providerOrMethod: string | null | undefined) {
  if (!providerOrMethod) return null
  return PROVIDER_LABELS[providerOrMethod] ?? null
}

/** 팝업이 막혔거나 팝업을 못 쓰는 환경이면 redirect 방식으로 다시 시도한다 */
export function shouldFallbackToRedirect(code: string | null | undefined) {
  return (
    code === 'auth/popup-blocked' ||
    code === 'auth/operation-not-supported-in-environment'
  )
}

/**
 * auth/account-exists-with-different-credential 안내 문구.
 * 이메일 열거 보호가 켜져 있으면 fetchSignInMethodsForEmail 결과가 빈 배열이라
 * 기존 가입 방법을 알 수 없으므로 일반 문구로 안내한다.
 */
export function accountExistsMessage(
  existingMethods: readonly string[],
  pendingProviderLabel = '구글',
) {
  const label = existingMethods
    .map((method) => providerLabel(method))
    .find((value): value is string => Boolean(value))

  if (label) {
    return `이미 ${label}로 가입된 이메일이에요. ${label}로 로그인하면 ${pendingProviderLabel} 계정이 자동으로 연결돼요.`
  }
  return `이미 다른 방법으로 가입된 이메일이에요. 원래 쓰던 방법으로 로그인하면 ${pendingProviderLabel} 계정이 자동으로 연결돼요.`
}

export function mapSocialAuthError(
  code: string | null | undefined,
): SocialAuthErrorInfo {
  switch (code) {
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
    case 'auth/user-cancelled':
      return { kind: 'cancelled', message: null }
    case 'auth/popup-blocked':
    case 'auth/operation-not-supported-in-environment':
      return {
        kind: 'redirect-fallback',
        message: '팝업이 막혀 있어서 페이지 이동 방식으로 로그인할게요.',
      }
    case 'auth/account-exists-with-different-credential':
      return { kind: 'account-exists', message: accountExistsMessage([]) }
    case 'auth/credential-already-in-use':
      return {
        kind: 'error',
        message: '이 소셜 계정은 이미 다른 계정에 연결돼 있어요.',
      }
    case 'auth/provider-already-linked':
      return { kind: 'error', message: '이미 연결된 로그인 방법이에요.' }
    case 'auth/unauthorized-domain':
      return {
        kind: 'error',
        message:
          '이 주소에서는 아직 소셜 로그인을 쓸 수 없어요. (Firebase 승인 도메인 설정 필요)',
      }
    case 'auth/operation-not-allowed':
      return {
        kind: 'error',
        message: '아직 이 로그인 방법이 켜져 있지 않아요.',
      }
    case 'auth/web-storage-unsupported':
      return {
        kind: 'error',
        message:
          '브라우저 저장소가 막혀 있어 로그인할 수 없어요. 사생활 보호 모드를 끄고 다시 시도해 주세요.',
      }
    case 'auth/network-request-failed':
      return { kind: 'error', message: '네트워크 연결 상태를 확인해주세요.' }
    case 'auth/too-many-requests':
      return {
        kind: 'error',
        message: '요청이 너무 많아요. 잠시 후 다시 시도해 주세요.',
      }
    case 'auth/user-disabled':
      return { kind: 'error', message: '관리자에 의해 사용이 중지된 계정입니다.' }
    case 'auth/invalid-custom-token':
    case 'auth/custom-token-mismatch':
      return {
        kind: 'error',
        message: '카카오 로그인 확인에 실패했어요. 다시 시도해 주세요.',
      }
    default:
      return {
        kind: 'error',
        message: '로그인 중 문제가 생겼어요. 잠시 후 다시 시도해 주세요.',
      }
  }
}

/** /api/auth/kakao/callback 이 /login?social_error=... 로 돌려보낼 때 쓰는 코드 */
export const SOCIAL_ERROR_PARAM = 'social_error'

export function socialErrorParamMessage(code: string | null | undefined) {
  if (!code) return null
  switch (code) {
    case 'kakao_cancelled':
      return null
    case 'kakao_state':
      return '로그인 요청이 만료됐거나 올바르지 않아요. 다시 시도해 주세요.'
    case 'kakao_config':
      return '카카오 로그인이 아직 설정되지 않았어요.'
    case 'kakao_token_missing':
      return '카카오 로그인 정보를 받지 못했어요. 다시 시도해 주세요.'
    default:
      return '카카오 로그인에 실패했어요. 잠시 후 다시 시도해 주세요.'
  }
}

export function emailsMatch(
  a: string | null | undefined,
  b: string | null | undefined,
) {
  if (!a || !b) return false
  return a.trim().toLowerCase() === b.trim().toLowerCase()
}

export type PendingLink = {
  providerId: string
  email: string | null
  /** OAuthCredential.toJSON() 결과 */
  credential: Record<string, unknown>
  createdAt: number
}

export function serializePendingLink(input: PendingLink) {
  return JSON.stringify(input)
}

export function parsePendingLink(
  raw: string | null | undefined,
  now: number,
  ttlMs = PENDING_LINK_TTL_MS,
): PendingLink | null {
  if (!raw) return null
  try {
    const value = JSON.parse(raw) as Partial<PendingLink>
    if (
      typeof value !== 'object' ||
      value === null ||
      typeof value.providerId !== 'string' ||
      typeof value.createdAt !== 'number' ||
      typeof value.credential !== 'object' ||
      value.credential === null
    ) {
      return null
    }
    if (now - value.createdAt > ttlMs || value.createdAt > now + 60_000) {
      return null
    }
    return {
      providerId: value.providerId,
      email: typeof value.email === 'string' ? value.email : null,
      credential: value.credential as Record<string, unknown>,
      createdAt: value.createdAt,
    }
  } catch {
    return null
  }
}

/**
 * 연결해도 되는지 판단: 대기 중인 소셜 계정 이메일과 방금 로그인한 계정 이메일이 같을 때만.
 * (다른 사람 계정에 실수로 붙는 것을 막는다)
 */
export function canLinkPending(
  pending: PendingLink | null,
  signedInEmail: string | null | undefined,
) {
  if (!pending || !pending.email) return false
  return emailsMatch(pending.email, signedInEmail)
}

export function pickNickname(
  candidates: ReadonlyArray<string | null | undefined>,
  fallback: string,
) {
  for (const candidate of candidates) {
    if (!candidate) continue
    const base = candidate.includes('@') ? candidate.split('@')[0] : candidate
    const trimmed = base.trim().replace(/\s+/g, ' ')
    if (trimmed.length > 0) return trimmed.slice(0, MAX_NICKNAME_LENGTH)
  }
  return fallback
}

/** 이메일 회원가입(src/app/signup)과 같은 모양의 users 문서 */
export function buildNewUserDoc(input: {
  uid: string
  email: string | null
  nickname: string
  now: Date
}) {
  return {
    uid: input.uid,
    email: input.email,
    nickname: input.nickname,
    photoURL: DEFAULT_GHOST_PHOTO,
    createdAt: input.now.toISOString(),
    role: 'user',
  }
}

function isEmptyDocField(value: unknown) {
  return value == null || (typeof value === 'string' && value.trim() === '')
}

export type UserDocFillInput = {
  email?: string | null
  nickname?: string | null
}

/**
 * 이미 있는 users 문서는 덮어쓰지 않고, 비어 있는(null/undefined/빈 문자열) 필드만 채운다.
 * 사용자가 바꿔 둔 닉네임은 유지한다.
 */
export function fillEmptyUserDocFields(
  existing: unknown,
  incoming: UserDocFillInput,
): { email?: string; nickname?: string } | null {
  if (!existing || typeof existing !== 'object') return null
  const data = existing as { email?: unknown; nickname?: unknown }
  const patch: { email?: string; nickname?: string } = {}
  const email = incoming.email?.trim()
  if (isEmptyDocField(data.email) && email) patch.email = email
  const nickname = incoming.nickname?.trim()
  if (isEmptyDocField(data.nickname) && nickname) {
    patch.nickname = nickname.slice(0, MAX_NICKNAME_LENGTH)
  }
  return patch.email !== undefined || patch.nickname !== undefined ? patch : null
}
