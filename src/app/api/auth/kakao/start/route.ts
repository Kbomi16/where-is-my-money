import { randomBytes } from 'node:crypto'
import { NextResponse, type NextRequest } from 'next/server'
import {
  KAKAO_STATE_COOKIE,
  KAKAO_STATE_COOKIE_PATH,
  KAKAO_STATE_TTL_SECONDS,
  buildKakaoAuthorizeUrl,
  encodeStateCookie,
  resolveKakaoRedirectUri,
  sanitizeNextPath,
} from '@/lib/auth/kakaoOAuth'
import { SOCIAL_ERROR_PARAM } from '@/lib/auth/socialAuthCore'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// 1단계: state(CSRF 토큰)를 httpOnly 쿠키에 저장하고 카카오 인가 화면으로 보낸다
export function GET(request: NextRequest) {
  const origin = request.nextUrl.origin
  const clientId = process.env.KAKAO_REST_API_KEY?.trim()

  if (!clientId) {
    console.error('[kakao] KAKAO_REST_API_KEY is not set')
    return NextResponse.redirect(
      new URL(`/login?${SOCIAL_ERROR_PARAM}=kakao_config`, origin),
    )
  }

  const state = randomBytes(32).toString('base64url')
  const next = sanitizeNextPath(request.nextUrl.searchParams.get('next'))
  const redirectUri = resolveKakaoRedirectUri(
    process.env.KAKAO_REDIRECT_URI,
    origin,
  )

  const response = NextResponse.redirect(
    buildKakaoAuthorizeUrl({ clientId, redirectUri, state }),
  )
  response.cookies.set(KAKAO_STATE_COOKIE, encodeStateCookie(state, next), {
    httpOnly: true,
    sameSite: 'lax',
    secure: request.nextUrl.protocol === 'https:',
    path: KAKAO_STATE_COOKIE_PATH,
    maxAge: KAKAO_STATE_TTL_SECONDS,
  })
  response.headers.set('Cache-Control', 'no-store')
  return response
}
