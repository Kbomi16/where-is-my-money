import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  accountExistsMessage,
  buildNewUserDoc,
  canLinkPending,
  emailsMatch,
  fillEmptyUserDocFields,
  mapSocialAuthError,
  parsePendingLink,
  pickNickname,
  providerLabel,
  serializePendingLink,
  shouldFallbackToRedirect,
  socialErrorParamMessage,
  PENDING_LINK_TTL_MS,
} from './socialAuthCore.ts'

describe('mapSocialAuthError', () => {
  it('treats popup close/cancel as silent cancel', () => {
    for (const code of [
      'auth/popup-closed-by-user',
      'auth/cancelled-popup-request',
      'auth/user-cancelled',
    ]) {
      assert.deepEqual(mapSocialAuthError(code), {
        kind: 'cancelled',
        message: null,
      })
    }
  })

  it('marks popup-blocked as redirect fallback', () => {
    assert.equal(mapSocialAuthError('auth/popup-blocked').kind, 'redirect-fallback')
    assert.equal(shouldFallbackToRedirect('auth/popup-blocked'), true)
    assert.equal(
      shouldFallbackToRedirect('auth/operation-not-supported-in-environment'),
      true,
    )
    assert.equal(shouldFallbackToRedirect('auth/popup-closed-by-user'), false)
    assert.equal(shouldFallbackToRedirect(undefined), false)
  })

  it('detects account-exists', () => {
    assert.equal(
      mapSocialAuthError('auth/account-exists-with-different-credential').kind,
      'account-exists',
    )
  })

  it('has a generic fallback message', () => {
    const info = mapSocialAuthError('auth/something-new')
    assert.equal(info.kind, 'error')
    assert.ok(info.message)
    assert.equal(mapSocialAuthError(null).kind, 'error')
  })
})

describe('accountExistsMessage', () => {
  it('names the existing method when known', () => {
    assert.equal(
      accountExistsMessage(['password']),
      '이미 이메일로 가입된 이메일이에요. 이메일로 로그인하면 구글 계정이 자동으로 연결돼요.',
    )
    assert.match(accountExistsMessage(['unknown', 'google.com']), /이미 구글로 가입된/)
  })

  it('falls back when email enumeration protection hides methods', () => {
    assert.match(accountExistsMessage([]), /^이미 다른 방법으로 가입된 이메일이에요/)
  })

  it('labels providers', () => {
    assert.equal(providerLabel('kakao'), '카카오')
    assert.equal(providerLabel('github.com'), null)
    assert.equal(providerLabel(undefined), null)
  })
})

describe('social_error param', () => {
  it('maps kakao callback errors', () => {
    assert.equal(socialErrorParamMessage(null), null)
    assert.equal(socialErrorParamMessage('kakao_cancelled'), null)
    assert.match(socialErrorParamMessage('kakao_state')!, /만료/)
    assert.match(socialErrorParamMessage('kakao_config')!, /설정/)
    assert.match(socialErrorParamMessage('weird')!, /카카오 로그인에 실패/)
  })
})

describe('pending link', () => {
  const now = 1_700_000_000_000
  const pending = {
    providerId: 'google.com',
    email: 'Me@Example.com',
    credential: { providerId: 'google.com', idToken: 'x' },
    createdAt: now,
  }

  it('round-trips and expires', () => {
    const raw = serializePendingLink(pending)
    assert.deepEqual(parsePendingLink(raw, now + 1000), pending)
    assert.equal(parsePendingLink(raw, now + PENDING_LINK_TTL_MS + 1), null)
    assert.equal(parsePendingLink('not json', now), null)
    assert.equal(parsePendingLink(JSON.stringify({ providerId: 1 }), now), null)
    assert.equal(parsePendingLink(null, now), null)
  })

  it('links only when emails match', () => {
    assert.equal(canLinkPending(pending, 'me@example.com '), true)
    assert.equal(canLinkPending(pending, 'other@example.com'), false)
    assert.equal(canLinkPending({ ...pending, email: null }, 'me@example.com'), false)
    assert.equal(canLinkPending(null, 'me@example.com'), false)
    assert.equal(emailsMatch(null, null), false)
  })
})

describe('profile helpers', () => {
  it('picks a nickname', () => {
    assert.equal(pickNickname([null, '  김 보미 ', 'x'], '사용자'), '김 보미')
    assert.equal(pickNickname(['', 'bomi@example.com'], '사용자'), 'bomi')
    assert.equal(pickNickname([null, undefined], '카카오 사용자'), '카카오 사용자')
    assert.equal(pickNickname(['a'.repeat(30)], 'x').length, 20)
  })

  it('builds the same users doc shape as email signup', () => {
    const doc = buildNewUserDoc({
      uid: 'kakao:1',
      email: null,
      nickname: '보미',
      now: new Date('2026-11-09T00:00:00.000Z'),
    })
    assert.deepEqual(doc, {
      uid: 'kakao:1',
      email: null,
      nickname: '보미',
      photoURL: 'ghost_1',
      createdAt: '2026-11-09T00:00:00.000Z',
      role: 'user',
    })
  })

  it('fills only empty users doc fields and keeps a custom nickname', () => {
    assert.deepEqual(
      fillEmptyUserDocFields(
        { email: null, nickname: '내가 바꾼 닉' },
        { email: 'bomi@example.com', nickname: '카카오닉' },
      ),
      { email: 'bomi@example.com' },
    )
    assert.deepEqual(
      fillEmptyUserDocFields(
        { email: '', nickname: '  ' },
        { email: 'bomi@example.com', nickname: '카카오닉' },
      ),
      { email: 'bomi@example.com', nickname: '카카오닉' },
    )
    assert.equal(
      fillEmptyUserDocFields(
        { email: 'old@example.com', nickname: '기존' },
        { email: 'new@example.com', nickname: '새닉' },
      ),
      null,
    )
    assert.equal(fillEmptyUserDocFields(null, { email: 'a@b.com' }), null)
    assert.equal(
      fillEmptyUserDocFields({ email: undefined }, { email: '  ' }),
      null,
    )
  })
})
