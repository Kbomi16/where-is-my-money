import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  buildKakaoAuthorizeUrl,
  buildKakaoTokenRequestBody,
  decodeStateCookie,
  encodeCompleteFragment,
  encodeStateCookie,
  extractKakaoAccountEmail,
  isKakaoUid,
  kakaoFirebaseUid,
  omitAuthEmail,
  parseCompleteFragment,
  parseKakaoProfile,
  planKakaoAuthUser,
  resolveKakaoRedirectUri,
  sanitizeNextPath,
  sanitizeProfileEmail,
  statesMatch,
} from './kakaoOAuth.ts'
import { normalizePrivateKey, readFirebaseAdminEnv } from '../server/adminEnv.ts'

const STATE = 'a'.repeat(43)

describe('kakaoFirebaseUid', () => {
  it('maps deterministically from kakao id', () => {
    assert.equal(kakaoFirebaseUid(1234567890), 'kakao:1234567890')
    assert.equal(kakaoFirebaseUid('42'), 'kakao:42')
    assert.equal(isKakaoUid('kakao:42'), true)
    assert.equal(isKakaoUid('abc'), false)
  })

  it('rejects non-numeric ids', () => {
    assert.throws(() => kakaoFirebaseUid('42; drop'))
    assert.throws(() => kakaoFirebaseUid(''))
    assert.throws(() => kakaoFirebaseUid(-1))
  })
})

describe('sanitizeNextPath', () => {
  it('allows in-app paths', () => {
    assert.equal(sanitizeNextPath('/my/budget'), '/my/budget')
    assert.equal(sanitizeNextPath('/history?month=2026-11'), '/history?month=2026-11')
  })

  it('blocks open redirects and auth pages', () => {
    for (const bad of [
      null,
      '',
      'https://evil.com',
      '//evil.com',
      '/\\evil.com',
      '/login',
      '/signup?x=1',
      '/auth/kakao',
      '/api/auth/kakao/start',
      '/a\nb',
    ]) {
      assert.equal(sanitizeNextPath(bad), '/', String(bad))
    }
  })
})

describe('state (CSRF)', () => {
  it('matches only identical long states', () => {
    assert.equal(statesMatch(STATE, STATE), true)
    assert.equal(statesMatch(STATE, 'a'.repeat(42) + 'b'), false)
    assert.equal(statesMatch(STATE, STATE + 'a'), false)
    assert.equal(statesMatch('short', 'short'), false)
    assert.equal(statesMatch(STATE, null), false)
    assert.equal(statesMatch(undefined, STATE), false)
  })

  it('round-trips the state cookie', () => {
    const cookie = encodeStateCookie(STATE, '/my?tab=1')
    assert.deepEqual(decodeStateCookie(cookie), { state: STATE, next: '/my?tab=1' })
    assert.deepEqual(decodeStateCookie(encodeStateCookie(STATE, 'https://evil.com')), {
      state: STATE,
      next: '/',
    })
    assert.equal(decodeStateCookie('short./'), null)
    assert.equal(decodeStateCookie(undefined), null)
    assert.equal(decodeStateCookie('nodot'), null)
  })
})

describe('kakao urls', () => {
  it('builds the authorize url', () => {
    const url = new URL(
      buildKakaoAuthorizeUrl({
        clientId: 'REST',
        redirectUri: 'http://localhost:3001/api/auth/kakao/callback',
        state: STATE,
      }),
    )
    assert.equal(url.origin + url.pathname, 'https://kauth.kakao.com/oauth/authorize')
    assert.equal(url.searchParams.get('client_id'), 'REST')
    assert.equal(url.searchParams.get('response_type'), 'code')
    assert.equal(url.searchParams.get('state'), STATE)
    assert.equal(
      url.searchParams.get('redirect_uri'),
      'http://localhost:3001/api/auth/kakao/callback',
    )
  })

  it('resolves redirect uri from env or request origin', () => {
    assert.equal(
      resolveKakaoRedirectUri(undefined, 'http://localhost:3001'),
      'http://localhost:3001/api/auth/kakao/callback',
    )
    assert.equal(
      resolveKakaoRedirectUri(' https://app.example.com/api/auth/kakao/callback ', 'http://x'),
      'https://app.example.com/api/auth/kakao/callback',
    )
    assert.equal(
      resolveKakaoRedirectUri('javascript:alert(1)', 'https://a.vercel.app'),
      'https://a.vercel.app/api/auth/kakao/callback',
    )
  })

  it('builds the token body with optional secret', () => {
    const base = { clientId: 'REST', redirectUri: 'http://l/cb', code: 'C' }
    const withoutSecret = new URLSearchParams(buildKakaoTokenRequestBody(base))
    assert.equal(withoutSecret.get('grant_type'), 'authorization_code')
    assert.equal(withoutSecret.has('client_secret'), false)
    const withSecret = new URLSearchParams(
      buildKakaoTokenRequestBody({ ...base, clientSecret: 'S' }),
    )
    assert.equal(withSecret.get('client_secret'), 'S')
  })
})

describe('parseKakaoProfile', () => {
  it('reads id and nickname, and leaves email null when unverified', () => {
    assert.deepEqual(
      parseKakaoProfile({
        id: 123,
        kakao_account: { profile: { nickname: ' 보미 ' } },
      }),
      { id: '123', nickname: '보미', email: null },
    )
    assert.deepEqual(parseKakaoProfile({ id: 5, properties: { nickname: 'p' } }), {
      id: '5',
      nickname: 'p',
      email: null,
    })
    assert.deepEqual(parseKakaoProfile({ id: 7 }), {
      id: '7',
      nickname: null,
      email: null,
    })
  })

  it('uses a verified kakao email only', () => {
    assert.deepEqual(
      parseKakaoProfile({
        id: 9,
        kakao_account: {
          email: 'bomi@example.com',
          is_email_valid: true,
          is_email_verified: true,
          profile: { nickname: '보미' },
        },
      }),
      { id: '9', nickname: '보미', email: 'bomi@example.com' },
    )
    assert.equal(
      parseKakaoProfile({
        id: 9,
        kakao_account: {
          email: 'bomi@example.com',
          is_email_valid: true,
          is_email_verified: false,
        },
      })?.email,
      null,
    )
    assert.equal(
      parseKakaoProfile({
        id: 9,
        kakao_account: {
          email: 'bomi@example.com',
          is_email_valid: false,
          is_email_verified: true,
        },
      })?.email,
      null,
    )
  })

  it('does not break when kakao_account or fields are missing', () => {
    assert.deepEqual(parseKakaoProfile({ id: 1, kakao_account: null }), {
      id: '1',
      nickname: null,
      email: null,
    })
    assert.equal(extractKakaoAccountEmail(undefined), null)
    assert.equal(extractKakaoAccountEmail({ email: 'a@b.com' }), null)
    assert.equal(
      extractKakaoAccountEmail({
        email: 'not-an-email',
        is_email_valid: true,
        is_email_verified: true,
      }),
      null,
    )
    assert.equal(
      extractKakaoAccountEmail({
        is_email_valid: true,
        is_email_verified: true,
      }),
      null,
    )
    assert.equal(
      extractKakaoAccountEmail({
        email: 'a@b.com',
        is_email_valid: 'true',
        is_email_verified: true,
      }),
      null,
    )
  })

  it('rejects bad payloads', () => {
    assert.equal(parseKakaoProfile(null), null)
    assert.equal(parseKakaoProfile({}), null)
    assert.equal(parseKakaoProfile({ id: -1 }), null)
    assert.equal(parseKakaoProfile({ id: 'abc' }), null)
  })
})

describe('complete fragment', () => {
  it('round-trips token and sanitizes next', () => {
    const hash = encodeCompleteFragment({
      token: 'aaa.bbb.ccc',
      next: '//evil.com',
      nickname: '보미',
    })
    assert.deepEqual(parseCompleteFragment(hash), {
      token: 'aaa.bbb.ccc',
      next: '/',
      nickname: '보미',
      email: null,
    })
    assert.equal(parseCompleteFragment('#token=not-a-jwt'), null)
    assert.equal(parseCompleteFragment(''), null)
  })

  it('round-trips a verified email and drops invalid ones', () => {
    const hash = encodeCompleteFragment({
      token: 'aaa.bbb.ccc',
      next: '/',
      nickname: null,
      email: 'bomi@example.com',
    })
    assert.deepEqual(parseCompleteFragment(hash), {
      token: 'aaa.bbb.ccc',
      next: '/',
      nickname: null,
      email: 'bomi@example.com',
    })
    assert.equal(sanitizeProfileEmail('not-an-email'), null)
    assert.equal(
      parseCompleteFragment(
        encodeCompleteFragment({
          token: 'aaa.bbb.ccc',
          next: '/',
          nickname: null,
          email: 'not-an-email',
        }),
      )?.email,
      null,
    )
  })
})

describe('planKakaoAuthUser', () => {
  it('creates a new Auth user with verified email and nickname', () => {
    assert.deepEqual(
      planKakaoAuthUser(null, {
        uid: 'kakao:1',
        email: 'bomi@example.com',
        nickname: '보미',
      }),
      {
        action: 'create',
        payload: {
          uid: 'kakao:1',
          email: 'bomi@example.com',
          emailVerified: true,
          displayName: '보미',
        },
      },
    )
    assert.deepEqual(
      planKakaoAuthUser(null, { uid: 'kakao:1', email: null, nickname: null }),
      { action: 'create', payload: { uid: 'kakao:1' } },
    )
  })

  it('does not change an existing Auth email and only fills blanks', () => {
    assert.deepEqual(
      planKakaoAuthUser(
        { email: 'old@example.com', displayName: '기존' },
        { uid: 'kakao:1', email: 'new@example.com', nickname: '새닉' },
      ),
      { action: 'none' },
    )
    assert.deepEqual(
      planKakaoAuthUser(
        { email: null, displayName: '' },
        { uid: 'kakao:1', email: 'new@example.com', nickname: '보미' },
      ),
      {
        action: 'update',
        payload: {
          email: 'new@example.com',
          emailVerified: true,
          displayName: '보미',
        },
      },
    )
  })

  it('omits email fields for a conflict retry', () => {
    assert.deepEqual(
      omitAuthEmail({
        uid: 'kakao:1',
        email: 'a@b.com',
        emailVerified: true,
        displayName: '보미',
      }),
      { uid: 'kakao:1', displayName: '보미' },
    )
    assert.deepEqual(
      omitAuthEmail({ email: 'a@b.com', emailVerified: true }),
      {},
    )
  })
})

describe('firebase admin env', () => {
  it('reports missing key names only', () => {
    const result = readFirebaseAdminEnv({ FIREBASE_ADMIN_PROJECT_ID: 'p' })
    assert.deepEqual(result, {
      ok: false,
      missing: ['FIREBASE_ADMIN_CLIENT_EMAIL', 'FIREBASE_ADMIN_PRIVATE_KEY'],
    })
  })

  it('normalizes escaped private keys', () => {
    const key = '"-----BEGIN PRIVATE KEY-----\\nabc\\n-----END PRIVATE KEY-----\\n"'
    assert.equal(
      normalizePrivateKey(key),
      '-----BEGIN PRIVATE KEY-----\nabc\n-----END PRIVATE KEY-----\n',
    )
    const result = readFirebaseAdminEnv({
      FIREBASE_ADMIN_PROJECT_ID: 'p',
      FIREBASE_ADMIN_CLIENT_EMAIL: 'c@p.iam.gserviceaccount.com',
      FIREBASE_ADMIN_PRIVATE_KEY: key,
    })
    assert.equal(result.ok, true)
  })
})
