// 마이페이지 등에 보여줄 로그인 방식 판별 (순수 함수, 외부 의존성 없음)

export type LoginProvider = 'email' | 'google' | 'kakao'

const KAKAO_UID_PREFIX = 'kakao:'

const PROVIDER_ORDER: readonly LoginProvider[] = ['email', 'google', 'kakao']

const PROVIDER_LABELS: Record<LoginProvider, string> = {
  email: '이메일',
  google: '구글',
  kakao: '카카오',
}

export function resolveLoginProviders(input: {
  uid?: string | null
  providerData?: ReadonlyArray<{ providerId?: string | null } | null> | null
}): LoginProvider[] {
  const found = new Set<LoginProvider>()

  if (typeof input.uid === 'string' && input.uid.startsWith(KAKAO_UID_PREFIX)) {
    found.add('kakao')
  }

  for (const entry of input.providerData ?? []) {
    const id = entry?.providerId
    if (id === 'google.com') found.add('google')
    if (id === 'password') found.add('email')
  }

  return PROVIDER_ORDER.filter((provider) => found.has(provider))
}

export function loginProviderLabel(provider: LoginProvider) {
  return PROVIDER_LABELS[provider]
}

/** 예: 「구글」, 「이메일 · 구글」. 없으면 「알 수 없음」 */
export function formatLoginProviders(providers: readonly LoginProvider[]) {
  if (providers.length === 0) return '알 수 없음'
  return providers.map(loginProviderLabel).join(' · ')
}

/** Auth email이 있으면 그걸 쓰고, 없으면 users 문서 email을 쓴다 */
export function resolveAccountEmail(
  authEmail?: string | null,
  docEmail?: string | null,
) {
  const auth = authEmail?.trim()
  if (auth) return auth
  const doc = docEmail?.trim()
  if (doc) return doc
  return null
}
