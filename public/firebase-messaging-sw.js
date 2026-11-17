/* eslint-disable no-undef */
// FCM 백그라운드 메시지 전용 서비스 워커 (시간대별 기록 리마인더 표시 + 클릭 처리).
// - scope: /firebase-cloud-messaging-push-scope (src/lib/push/pushCore.ts PUSH_SW_SCOPE)
//   페이지 요청을 가로채지 않고, 나중에 "/" scope PWA 서비스 워커가 생겨도 겹치지 않는다.
// - Firebase 웹 config는 레포에 박지 않고 등록 URL 쿼리스트링으로 받는다
//   (src/lib/push/pushClient.ts → buildMessagingSwUrl).

const params = new URL(self.location.href).searchParams
const sdkVersion = params.get('v') || ''
const CONFIG_KEYS = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId']
const DEFAULT_LINK = '/'

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))

// 알림 클릭 → 이미 열린 앱 탭이 있으면 그 탭으로, 없으면 새 창으로 연다.
// firebase SDK보다 먼저 등록해야 SDK 기본 처리보다 우선한다.
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const raw = (event.notification.data && event.notification.data.link) || DEFAULT_LINK
  const target = new URL(raw, self.location.origin)
  // 다른 도메인으로는 열지 않는다
  const url = target.origin === self.location.origin ? target.href : new URL(DEFAULT_LINK, self.location.origin).href

  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      for (const client of windows) {
        if (new URL(client.url).origin !== self.location.origin) continue
        await client.focus()
        if ('navigate' in client && client.url !== url) {
          await client.navigate(url).catch(() => undefined)
        }
        return
      }
      await self.clients.openWindow(url)
    })(),
  )
})

const config = {}
for (const key of CONFIG_KEYS) {
  const value = params.get(key)
  if (value) config[key] = value
}

// 버전 형식만 허용해 임의 스크립트 주소를 불러오지 않게 한다
if (/^\d+\.\d+\.\d+$/.test(sdkVersion) && config.apiKey && config.projectId && config.messagingSenderId && config.appId) {
  importScripts(
    `https://www.gstatic.com/firebasejs/${sdkVersion}/firebase-app-compat.js`,
    `https://www.gstatic.com/firebasejs/${sdkVersion}/firebase-messaging-compat.js`,
  )

  firebase.initializeApp(config)
  const messaging = firebase.messaging()

  // 서버는 data 전용 메시지를 보낸다 (src/lib/server/pushTokens.ts). 여기서 직접 알림을 띄운다.
  messaging.onBackgroundMessage((payload) => {
    // 앱 탭이 보일 때는 여기로 오지 않고 페이지 onMessage(src/lib/push/pushClient.ts)가 띄운다.
    // 규칙은 src/lib/push/pushCore.ts readPushDisplay 와 같게 유지한다.
    const data = payload.data || {}
    const title = (data.title || '').trim()
    if (!title) return undefined
    const link = data.link && data.link.startsWith('/') && !data.link.startsWith('//') ? data.link : DEFAULT_LINK
    const options = {
      body: data.body || '',
      icon: '/imgs/web-app-manifest-192x192.png',
      badge: '/imgs/web-app-manifest-192x192.png',
      data: { link },
    }
    // 같은 슬롯 리마인더(tag: reminder:2026-11-16:lunch)는 하나로 합친다
    if (data.tag) options.tag = data.tag
    return self.registration.showNotification(title, options)
  })
} else {
  console.warn('[firebase-messaging-sw] Firebase config 또는 SDK 버전이 없어 푸시를 처리하지 않아요.')
}
