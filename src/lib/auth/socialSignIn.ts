import {
  GoogleAuthProvider,
  OAuthCredential,
  fetchSignInMethodsForEmail,
  getAdditionalUserInfo,
  getRedirectResult,
  linkWithCredential,
  signInWithPopup,
  signInWithRedirect,
  updateProfile,
  type User,
  type UserCredential,
} from 'firebase/auth'
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import {
  DEFAULT_GHOST_PHOTO,
  accountExistsMessage,
  buildNewUserDoc,
  canLinkPending,
  fillEmptyUserDocFields,
  mapSocialAuthError,
  parsePendingLink,
  pickNickname,
  serializePendingLink,
  shouldFallbackToRedirect,
  type PendingLink,
} from '@/lib/auth/socialAuthCore'

const PENDING_LINK_KEY = 'wimm:pending-social-link'
export const PENDING_LINK_EVENT = 'wimm:pending-social-link-changed'

export function errorCode(error: unknown) {
  return typeof error === 'object' && error !== null && 'code' in error
    ? String((error as { code: unknown }).code)
    : null
}

function createGoogleProvider() {
  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({ prompt: 'select_account' })
  return provider
}

export type GoogleSignInResult =
  | { status: 'signed-in'; credential: UserCredential }
  | { status: 'redirecting' }

/**
 * 기본은 팝업. 팝업이 막혔거나 지원되지 않는 환경(일부 PWA·인앱 브라우저)에서만 redirect로 폴백.
 * 클릭 핸들러에서 다른 await 없이 바로 호출해야 팝업 차단을 피할 수 있다.
 */
export async function signInWithGoogle(): Promise<GoogleSignInResult> {
  const provider = createGoogleProvider()
  try {
    const credential = await signInWithPopup(auth, provider)
    return { status: 'signed-in', credential }
  } catch (error) {
    if (shouldFallbackToRedirect(errorCode(error))) {
      await signInWithRedirect(auth, provider)
      return { status: 'redirecting' }
    }
    throw error
  }
}

export function completeGoogleRedirect() {
  return getRedirectResult(auth)
}

// ---------- 계정 충돌(pending credential) ----------

function storage() {
  try {
    return typeof window === 'undefined' ? null : window.sessionStorage
  } catch {
    return null
  }
}

function notifyPendingChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(PENDING_LINK_EVENT))
  }
}

export function readPendingLink(): PendingLink | null {
  const store = storage()
  const pending = parsePendingLink(store?.getItem(PENDING_LINK_KEY), Date.now())
  if (!pending) store?.removeItem(PENDING_LINK_KEY)
  return pending
}

export function clearPendingLink() {
  storage()?.removeItem(PENDING_LINK_KEY)
  notifyPendingChanged()
}

function savePendingLink(pending: PendingLink) {
  storage()?.setItem(PENDING_LINK_KEY, serializePendingLink(pending))
  notifyPendingChanged()
}

/**
 * 소셜 로그인 에러를 사용자 문구로 바꾼다.
 * account-exists 이면 pending credential을 세션에 잠시(10분) 보관해 두고,
 * 기존 방법으로 로그인하면 linkPendingCredential()이 연결한다.
 */
export async function describeSocialSignInError(error: unknown) {
  const code = errorCode(error)
  const info = mapSocialAuthError(code)
  if (info.kind !== 'account-exists') return info.message

  const credential = GoogleAuthProvider.credentialFromError(
    error as Parameters<typeof GoogleAuthProvider.credentialFromError>[0],
  )
  const email =
    (error as { customData?: { email?: unknown } }).customData?.email ?? null
  const emailText = typeof email === 'string' ? email : null

  if (credential) {
    savePendingLink({
      providerId: credential.providerId,
      email: emailText,
      credential: credential.toJSON() as Record<string, unknown>,
      createdAt: Date.now(),
    })
  }

  // 이메일 열거 보호가 켜져 있으면 빈 배열이 오므로 일반 문구로 안내한다
  let methods: string[] = []
  if (emailText) {
    try {
      methods = await fetchSignInMethodsForEmail(auth, emailText)
    } catch {
      methods = []
    }
  }
  return accountExistsMessage(methods)
}

export type LinkPendingResult =
  | { status: 'none' }
  | { status: 'linked'; providerLabel: string }
  | { status: 'mismatch' }
  | { status: 'failed'; message: string | null }

/** 기존 방법으로 로그인한 직후 호출. 이메일이 같을 때만 연결한다 */
export async function linkPendingCredential(
  user: User,
): Promise<LinkPendingResult> {
  const pending = readPendingLink()
  if (!pending) return { status: 'none' }
  if (!canLinkPending(pending, user.email)) return { status: 'mismatch' }

  try {
    const credential = OAuthCredential.fromJSON(pending.credential)
    if (!credential) {
      clearPendingLink()
      return { status: 'failed', message: null }
    }
    await linkWithCredential(user, credential)
    clearPendingLink()
    return { status: 'linked', providerLabel: '구글' }
  } catch (error) {
    const code = errorCode(error)
    if (code === 'auth/provider-already-linked') {
      clearPendingLink()
      return { status: 'linked', providerLabel: '구글' }
    }
    clearPendingLink()
    return { status: 'failed', message: mapSocialAuthError(code).message }
  }
}

// ---------- 첫 가입 처리 ----------

/**
 * users/{uid} 문서가 없으면 이메일 회원가입과 같은 모양으로 만든다.
 * 이미 있으면 덮어쓰지 않고, 비어 있는 email/nickname만 채운다.
 * 읽기가 거부되면 신규 가입일 때만 쓴다.
 */
export async function ensureUserDocument(
  user: User,
  options: { isNewUser: boolean; nickname: string; email?: string | null },
) {
  const ref = doc(db, 'users', user.uid)
  const email = user.email ?? options.email ?? null
  let snapshot: Awaited<ReturnType<typeof getDoc>> | null = null
  try {
    snapshot = await getDoc(ref)
  } catch (error) {
    console.warn('users 문서 확인 실패:', errorCode(error))
  }
  if (snapshot?.exists()) {
    const patch = fillEmptyUserDocFields(snapshot.data(), {
      email,
      nickname: options.nickname,
    })
    if (patch) await updateDoc(ref, patch)
    return patch ? 'updated' : 'exists'
  }
  if (snapshot === null && !options.isNewUser) return 'skipped' as const

  await setDoc(
    ref,
    buildNewUserDoc({
      uid: user.uid,
      email,
      nickname: options.nickname,
      now: new Date(),
    }),
  )
  return 'created' as const
}

/** 소셜 로그인 성공 후 공통 후처리: 신규면 프로필(닉네임·유령 캐릭터) 설정 + users 문서 */
export async function finishSocialSignIn(
  credential: UserCredential,
  options: {
    nickname?: string | null
    email?: string | null
    fallbackNickname: string
  },
) {
  const user = credential.user
  const isNewUser = getAdditionalUserInfo(credential)?.isNewUser ?? false
  const nickname = pickNickname(
    [user.displayName, options.nickname, user.email, options.email],
    options.fallbackNickname,
  )

  if (isNewUser || !user.displayName) {
    try {
      await updateProfile(user, {
        displayName: nickname,
        photoURL: isNewUser ? DEFAULT_GHOST_PHOTO : user.photoURL,
      })
    } catch (error) {
      console.warn('프로필 설정 실패:', errorCode(error))
    }
  }

  let userDoc: 'exists' | 'updated' | 'skipped' | 'created' | 'failed' = 'failed'
  try {
    userDoc = await ensureUserDocument(user, {
      isNewUser,
      nickname,
      email: options.email,
    })
  } catch (error) {
    console.error('users 문서 저장 실패:', errorCode(error))
  }

  return { isNewUser, nickname, userDoc }
}
