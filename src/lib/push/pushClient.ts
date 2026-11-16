// 브라우저 전용: 푸시 권한·토큰·서비스 워커 처리 (클라이언트 컴포넌트에서만 import)
import { SDK_VERSION } from 'firebase/app'
import type { User } from 'firebase/auth'
import {
  deleteToken,
  getMessaging,
  getToken,
  isSupported,
  onMessage,
  type Messaging,
} from 'firebase/messaging'
import app, { firebaseConfig } from '@/lib/firebase'
import {
  PUSH_SW_SCOPE,
  buildMessagingSwUrl,
  isIosUserAgent,
  pushTokenStorageKey,
  readPushDisplay,
  resolvePushSupport,
  type PushSupport,
} from './pushCore'

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY?.trim() ?? ''
const NOTIFICATION_ICON = '/imgs/web-app-manifest-192x192.png'
/** 설정 화면에서 알림을 켠 직후 포그라운드 수신을 바로 붙이기 위한 이벤트 */
export const PUSH_ENABLED_EVENT = 'wimm:push-enabled'

export async function detectPushSupport(): Promise<PushSupport> {
  if (typeof window === 'undefined') {
    return { ok: false, reason: 'unsupported', message: '브라우저에서만 쓸 수 있어요.' }
  }
  const nav = window.navigator as Navigator & { standalone?: boolean }
  const messagingSupported = await isSupported().catch(() => false)
  return resolvePushSupport({
    hasNotification: 'Notification' in window,
    hasServiceWorker: 'serviceWorker' in nav,
    hasPushManager: 'PushManager' in window,
    messagingSupported,
    isIos: isIosUserAgent(nav.userAgent, nav.maxTouchPoints),
    isStandalone:
      window.matchMedia('(display-mode: standalone)').matches || nav.standalone === true,
    hasVapidKey: VAPID_KEY.length > 0,
  })
}

const SW_ACTIVATE_TIMEOUT_MS = 10_000

/** 새로 설치 중인 서비스 워커가 activated 될 때까지 기다린다 (그전에 pushManager.subscribe 하면 실패할 수 있음) */
function waitForActive(registration: ServiceWorkerRegistration) {
  if (registration.active) return Promise.resolve()
  const incoming = registration.installing ?? registration.waiting
  if (!incoming) return Promise.resolve()
  return new Promise<void>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error('service worker activate timeout')),
      SW_ACTIVATE_TIMEOUT_MS,
    )
    incoming.addEventListener('statechange', () => {
      if (incoming.state === 'activated') {
        clearTimeout(timer)
        resolve()
      }
    })
  })
}

async function registerMessagingServiceWorker() {
  const url = buildMessagingSwUrl(firebaseConfig, SDK_VERSION)
  const registration = await navigator.serviceWorker.register(url, { scope: PUSH_SW_SCOPE })
  await registration.update().catch(() => undefined)
  await waitForActive(registration)
  return registration
}

function messaging(): Messaging {
  return getMessaging(app)
}

async function callPushApi(user: User, path: string, method: 'POST' | 'DELETE', body: unknown) {
  const idToken = await user.getIdToken()
  const response = await fetch(path, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
    body: JSON.stringify(body),
  })
  if (!response.ok) throw new Error(`${path} ${response.status}`)
  return response
}

export function readSavedPushToken(uid: string) {
  try {
    return window.localStorage.getItem(pushTokenStorageKey(uid))
  } catch {
    return null
  }
}

function writeSavedPushToken(uid: string, token: string | null) {
  try {
    if (token) window.localStorage.setItem(pushTokenStorageKey(uid), token)
    else window.localStorage.removeItem(pushTokenStorageKey(uid))
  } catch {
    // 저장소가 막힌 브라우저(시크릿 모드 등)는 무시
  }
}

export type EnablePushResult =
  | { ok: true }
  | { ok: false; reason: 'denied' | 'dismissed' | 'unsupported' | 'failed'; message: string }

/** 권한 요청 → 서비스 워커 등록 → FCM 토큰 발급 → 서버 저장 */
export async function enablePush(user: User): Promise<EnablePushResult> {
  const support = await detectPushSupport()
  if (!support.ok) return { ok: false, reason: 'unsupported', message: support.message }

  const permission =
    Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission()
  if (permission === 'denied') {
    return {
      ok: false,
      reason: 'denied',
      message: '알림이 차단돼 있어요. 브라우저 사이트 설정에서 알림을 허용해 주세요.',
    }
  }
  if (permission !== 'granted') {
    return { ok: false, reason: 'dismissed', message: '알림 권한을 허용해야 켤 수 있어요.' }
  }

  try {
    const serviceWorkerRegistration = await registerMessagingServiceWorker()
    const token = await getToken(messaging(), { vapidKey: VAPID_KEY, serviceWorkerRegistration })
    if (!token) throw new Error('empty token')
    await callPushApi(user, '/api/push/token', 'POST', { token })
    writeSavedPushToken(user.uid, token)
    window.dispatchEvent(new Event(PUSH_ENABLED_EVENT))
    return { ok: true }
  } catch (error) {
    console.error('[push] 켜기 실패', error)
    return { ok: false, reason: 'failed', message: '알림을 켜지 못했어요. 잠시 후 다시 시도해 주세요.' }
  }
}

/** FCM 토큰 삭제 + 서버 문서 삭제. 한쪽이 실패해도 이 기기에서는 꺼진 상태로 둔다 */
export async function disablePush(user: User) {
  const token = readSavedPushToken(user.uid)
  writeSavedPushToken(user.uid, null)
  await Promise.allSettled([
    (async () => {
      if (!(await isSupported().catch(() => false))) return
      if (Notification.permission !== 'granted' || !VAPID_KEY) return
      // deleteToken()은 Messaging에 등록된 SW가 없으면 쿼리스트링 없는 기본 SW를 같은 scope로
      // 다시 등록해 버린다(config 없는 SW로 바뀜). getToken에 우리 등록을 먼저 넘겨 두고 지운다.
      // 캐시된 토큰이 유효하면 getToken은 네트워크 요청 없이 그대로 돌려준다.
      const serviceWorkerRegistration = await registerMessagingServiceWorker()
      await getToken(messaging(), { vapidKey: VAPID_KEY, serviceWorkerRegistration })
      await deleteToken(messaging())
    })(),
    token ? callPushApi(user, '/api/push/token', 'DELETE', { token }) : Promise.resolve(),
  ]).then((results) => {
    for (const result of results) {
      if (result.status === 'rejected') console.error('[push] 끄기 중 오류', result.reason)
    }
  })
}

/**
 * 앱 탭이 화면에 보일 때는 FCM이 서비스 워커 onBackgroundMessage 대신 페이지 onMessage로 넘긴다.
 * 그때도 OS 알림이 보이도록 메시징 SW 등록으로 직접 띄운다.
 * (같은 메시지는 백그라운드·포그라운드 중 한쪽으로만 오고, 탭이 여러 개여도 tag가 같아 하나로 합쳐진다)
 * 돌려준 함수를 부르면 수신을 끊는다.
 */
export async function listenForegroundMessages(): Promise<() => void> {
  const noop = () => undefined
  if (typeof window === 'undefined' || !('Notification' in window)) return noop
  if (Notification.permission !== 'granted') return noop
  if (!(await isSupported().catch(() => false))) return noop
  const registration = await navigator.serviceWorker.getRegistration(PUSH_SW_SCOPE)
  if (!registration) return noop

  return onMessage(messaging(), (payload) => {
    const display = readPushDisplay(payload.data)
    if (!display) return
    registration
      .showNotification(display.title, {
        body: display.body,
        icon: NOTIFICATION_ICON,
        badge: NOTIFICATION_ICON,
        ...(display.tag ? { tag: display.tag } : {}),
        data: { link: display.link },
      })
      .catch((error) => console.warn('[push] 포그라운드 알림 표시 실패', error))
  })
}
