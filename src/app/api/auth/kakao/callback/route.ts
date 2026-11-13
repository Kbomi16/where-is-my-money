import { NextResponse, type NextRequest } from 'next/server'
import {
  KAKAO_COMPLETE_PATH,
  KAKAO_STATE_COOKIE,
  KAKAO_STATE_COOKIE_PATH,
  KAKAO_TOKEN_URL,
  KAKAO_USER_URL,
  buildKakaoTokenRequestBody,
  decodeStateCookie,
  encodeCompleteFragment,
  kakaoFirebaseUid,
  parseKakaoProfile,
  resolveKakaoRedirectUri,
  statesMatch,
} from '@/lib/auth/kakaoOAuth'
import { SOCIAL_ERROR_PARAM } from '@/lib/auth/socialAuthCore'
import { ensureKakaoAuthUser } from '@/lib/server/ensureKakaoAuthUser'
import { MissingAdminEnvError, getAdminAuth } from '@/lib/server/firebaseAdmin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function withCleanup(response: NextResponse) {
  response.cookies.set(KAKAO_STATE_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    path: KAKAO_STATE_COOKIE_PATH,
    maxAge: 0,
  })
  response.headers.set('Cache-Control', 'no-store')
  response.headers.set('Referrer-Policy', 'no-referrer')
  return response
}

// 2단계: state 검증 → 인가 코드로 토큰 교환 → 사용자 조회 → Firebase custom token 발급
export async function GET(request: NextRequest) {
  const url = request.nextUrl
  const origin = url.origin
  const fail = (code: string) =>
    withCleanup(
      NextResponse.redirect(
        new URL(`/login?${SOCIAL_ERROR_PARAM}=${code}`, origin),
      ),
    )

  const kakaoError = url.searchParams.get('error')
  if (kakaoError) {
    return fail(kakaoError === 'access_denied' ? 'kakao_cancelled' : 'kakao_denied')
  }

  const saved = decodeStateCookie(request.cookies.get(KAKAO_STATE_COOKIE)?.value)
  if (!saved || !statesMatch(saved.state, url.searchParams.get('state'))) {
    return fail('kakao_state')
  }

  const code = url.searchParams.get('code')
  if (!code) return fail('kakao_code')

  const clientId = process.env.KAKAO_REST_API_KEY?.trim()
  if (!clientId) return fail('kakao_config')

  try {
    const redirectUri = resolveKakaoRedirectUri(
      process.env.KAKAO_REDIRECT_URI,
      origin,
    )
    const tokenResponse = await fetch(KAKAO_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
      },
      body: buildKakaoTokenRequestBody({
        clientId,
        redirectUri,
        code,
        clientSecret: process.env.KAKAO_CLIENT_SECRET?.trim() || null,
      }),
      cache: 'no-store',
    })
    if (!tokenResponse.ok) {
      console.error('[kakao] token exchange failed', tokenResponse.status)
      return fail('kakao_token')
    }
    const tokenJson = (await tokenResponse.json()) as { access_token?: unknown }
    if (typeof tokenJson.access_token !== 'string') return fail('kakao_token')

    // 액세스 토큰으로 카카오 서버에 직접 사용자 조회 = 토큰 검증
    const userResponse = await fetch(KAKAO_USER_URL, {
      headers: { Authorization: `Bearer ${tokenJson.access_token}` },
      cache: 'no-store',
    })
    if (!userResponse.ok) {
      console.error('[kakao] user lookup failed', userResponse.status)
      return fail('kakao_profile')
    }
    const profile = parseKakaoProfile(await userResponse.json())
    if (!profile) return fail('kakao_profile')

    const uid = kakaoFirebaseUid(profile.id)
    const adminAuth = getAdminAuth()
    // Auth email 설정 실패가 로그인을 막지 않게 따로 처리한다 (이메일 충돌 포함)
    try {
      await ensureKakaoAuthUser(adminAuth, {
        uid,
        email: profile.email,
        nickname: profile.nickname,
      })
    } catch (error) {
      console.error(
        '[kakao] auth profile failed:',
        error instanceof Error ? error.name : 'unknown',
      )
    }

    const customToken = await adminAuth.createCustomToken(uid, {
      provider: 'kakao',
    })

    return withCleanup(
      NextResponse.redirect(
        new URL(
          `${KAKAO_COMPLETE_PATH}${encodeCompleteFragment({
            token: customToken,
            next: saved.next,
            nickname: profile.nickname,
            email: profile.email,
          })}`,
          origin,
        ),
      ),
    )
  } catch (error) {
    if (error instanceof MissingAdminEnvError) {
      console.error('[kakao] missing env:', error.missing.join(', '))
      return fail('kakao_config')
    }
    console.error(
      '[kakao] callback failed:',
      error instanceof Error ? error.name : 'unknown',
    )
    return fail('kakao_server')
  }
}
