import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  formatLoginProviders,
  loginProviderLabel,
  resolveAccountEmail,
  resolveLoginProviders,
} from './loginProviders.ts'

describe('resolveLoginProviders', () => {
  it('detects kakao-only from uid when providerData is empty', () => {
    assert.deepEqual(
      resolveLoginProviders({ uid: 'kakao:1234567890', providerData: [] }),
      ['kakao'],
    )
    assert.deepEqual(resolveLoginProviders({ uid: 'kakao:1' }), ['kakao'])
  })

  it('detects google-only', () => {
    assert.deepEqual(
      resolveLoginProviders({
        uid: 'abc',
        providerData: [{ providerId: 'google.com' }],
      }),
      ['google'],
    )
  })

  it('detects email-only', () => {
    assert.deepEqual(
      resolveLoginProviders({
        uid: 'abc',
        providerData: [{ providerId: 'password' }],
      }),
      ['email'],
    )
  })

  it('shows email and google together in a stable order', () => {
    assert.deepEqual(
      resolveLoginProviders({
        uid: 'abc',
        providerData: [
          { providerId: 'google.com' },
          { providerId: 'password' },
          { providerId: 'google.com' },
        ],
      }),
      ['email', 'google'],
    )
  })

  it('returns an empty array when the method is unknown', () => {
    assert.deepEqual(resolveLoginProviders({ uid: 'abc', providerData: [] }), [])
    assert.deepEqual(
      resolveLoginProviders({
        uid: 'abc',
        providerData: [{ providerId: 'github.com' }, null],
      }),
      [],
    )
    assert.deepEqual(resolveLoginProviders({ uid: '', providerData: null }), [])
  })

  it('keeps kakao even if other providers are also present', () => {
    assert.deepEqual(
      resolveLoginProviders({
        uid: 'kakao:42',
        providerData: [{ providerId: 'password' }],
      }),
      ['email', 'kakao'],
    )
  })
})

describe('labels', () => {
  it('maps provider ids to Korean labels', () => {
    assert.equal(loginProviderLabel('email'), '이메일')
    assert.equal(loginProviderLabel('google'), '구글')
    assert.equal(loginProviderLabel('kakao'), '카카오')
    assert.equal(formatLoginProviders(['google']), '구글')
    assert.equal(formatLoginProviders(['email', 'google']), '이메일 · 구글')
    assert.equal(formatLoginProviders([]), '알 수 없음')
  })
})

describe('resolveAccountEmail', () => {
  it('prefers Auth email and falls back to the users doc', () => {
    assert.equal(
      resolveAccountEmail('a@example.com', 'b@example.com'),
      'a@example.com',
    )
    assert.equal(resolveAccountEmail(null, 'b@example.com'), 'b@example.com')
    assert.equal(resolveAccountEmail('  ', 'b@example.com'), 'b@example.com')
    assert.equal(resolveAccountEmail(null, null), null)
    assert.equal(resolveAccountEmail(undefined, ''), null)
  })
})
