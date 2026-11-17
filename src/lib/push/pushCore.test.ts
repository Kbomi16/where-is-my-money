import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  PUSH_SW_PATH,
  buildMessagingSwUrl,
  clampUserAgent,
  collectInvalidTokens,
  isInvalidTokenError,
  isIosUserAgent,
  parsePushToken,
  pushTokenStorageKey,
  readPushDisplay,
  readBearerToken,
  resolvePushSupport,
} from './pushCore.ts'
import { pushTokenDocId } from './pushTokenId.ts'

const supported = {
  hasNotification: true,
  hasServiceWorker: true,
  hasPushManager: true,
  messagingSupported: true,
  isIos: false,
  isStandalone: false,
  hasVapidKey: true,
}

describe('readPushDisplay', () => {
  it('제목·본문·링크·tag를 꺼낸다', () => {
    assert.deepEqual(readPushDisplay({ title: 't', body: 'b', link: '/history', tag: 'reminder:x' }), {
      title: 't',
      body: 'b',
      link: '/history',
      tag: 'reminder:x',
    })
  })
  it('제목이 없으면 null, 외부·프로토콜 상대 링크는 / 로', () => {
    assert.equal(readPushDisplay({ body: 'b' }), null)
    assert.equal(readPushDisplay(undefined), null)
    assert.equal(readPushDisplay({ title: 't', link: 'https://evil.test' })?.link, '/')
    assert.equal(readPushDisplay({ title: 't', link: '//evil.test' })?.link, '/')
    assert.equal(readPushDisplay({ title: 't' })?.tag, undefined)
  })
})

describe('무효 토큰 판정', () => {
  it('not-registered / invalid-registration-token만 무효', () => {
    assert.equal(isInvalidTokenError('messaging/registration-token-not-registered'), true)
    assert.equal(isInvalidTokenError('messaging/invalid-registration-token'), true)
    assert.equal(isInvalidTokenError('messaging/internal-error'), false)
    assert.equal(isInvalidTokenError(undefined), false)
  })
  it('collectInvalidTokens는 응답 순서대로 무효 토큰만 고른다', () => {
    assert.deepEqual(
      collectInvalidTokens(
        ['a', 'b', 'c', 'd'],
        [
          { success: true },
          { success: false, error: { code: 'messaging/registration-token-not-registered' } },
          { success: false, error: { code: 'messaging/server-unavailable' } },
          { success: false, error: { code: 'messaging/invalid-registration-token' } },
        ],
      ),
      ['b', 'd'],
    )
  })
})

describe('pushTokenDocId', () => {
  it('같은 토큰이면 같은 64자 hex, 다르면 다르다', () => {
    const a = pushTokenDocId('token-a')
    assert.match(a, /^[0-9a-f]{64}$/)
    assert.equal(a, pushTokenDocId('token-a'))
    assert.notEqual(a, pushTokenDocId('token-b'))
  })
})

describe('resolvePushSupport', () => {
  it('모두 되면 ok', () => {
    assert.deepEqual(resolvePushSupport(supported), { ok: true })
  })
  it('iOS 브라우저 탭이면 홈 화면 추가 안내 (다른 조건보다 먼저)', () => {
    const result = resolvePushSupport({ ...supported, isIos: true, hasPushManager: false })
    assert.equal(result.ok, false)
    assert.equal(!result.ok && result.reason, 'ios-not-installed')
  })
  it('iOS 홈 화면 앱이면 ok', () => {
    assert.deepEqual(resolvePushSupport({ ...supported, isIos: true, isStandalone: true }), { ok: true })
  })
  it('API가 없거나 messaging 미지원이면 unsupported', () => {
    for (const key of ['hasNotification', 'hasServiceWorker', 'hasPushManager', 'messagingSupported'] as const) {
      const result = resolvePushSupport({ ...supported, [key]: false })
      assert.equal(!result.ok && result.reason, 'unsupported', key)
    }
  })
  it('VAPID 키가 없으면 missing-config', () => {
    const result = resolvePushSupport({ ...supported, hasVapidKey: false })
    assert.equal(!result.ok && result.reason, 'missing-config')
  })
})

describe('isIosUserAgent', () => {
  it('iPhone, iPadOS(Mac UA + 터치)는 iOS, 일반 Mac·안드로이드는 아님', () => {
    assert.equal(isIosUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)'), true)
    assert.equal(isIosUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 5), true)
    assert.equal(isIosUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 0), false)
    assert.equal(isIosUserAgent('Mozilla/5.0 (Linux; Android 14)'), false)
  })
})

describe('buildMessagingSwUrl', () => {
  it('SDK 버전과 비어 있지 않은 config만 쿼리스트링으로 넣는다', () => {
    const url = buildMessagingSwUrl({ apiKey: 'k', projectId: 'p', appId: ' ', authDomain: undefined }, '12.9.0')
    assert.equal(url, `${PUSH_SW_PATH}?v=12.9.0&apiKey=k&projectId=p`)
  })
  it('특수문자는 인코딩된다', () => {
    const url = buildMessagingSwUrl({ appId: '1:2:web:3' }, '12.9.0')
    assert.equal(new URL(url, 'https://x.test').searchParams.get('appId'), '1:2:web:3')
  })
})

describe('입력 검사', () => {
  it('parsePushToken', () => {
    assert.equal(parsePushToken(' abc:DEF_-1 '), 'abc:DEF_-1')
    assert.equal(parsePushToken(''), null)
    assert.equal(parsePushToken('a b'), null)
    assert.equal(parsePushToken(123), null)
    assert.equal(parsePushToken('x'.repeat(4097)), null)
  })
  it('readBearerToken', () => {
    assert.equal(readBearerToken('Bearer abc.def'), 'abc.def')
    assert.equal(readBearerToken('bearer   xyz'), 'xyz')
    assert.equal(readBearerToken('Basic abc'), null)
    assert.equal(readBearerToken(null), null)
  })
  it('clampUserAgent, pushTokenStorageKey', () => {
    assert.equal(clampUserAgent('x'.repeat(500)).length, 300)
    assert.equal(clampUserAgent(null), '')
    assert.equal(pushTokenStorageKey('kakao:1'), 'push-token:kakao:1')
  })
})
