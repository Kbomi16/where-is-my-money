# 소셜 로그인(구글·카카오) 설정 가이드

버튼 하나로 **처음이면 자동 가입, 이미 가입했으면 로그인**됩니다. 기존 이메일 로그인은 그대로입니다.

## 구조 요약

| 구분 | 방식 | 관련 파일 |
| --- | --- | --- |
| 구글 | Firebase `GoogleAuthProvider` + `signInWithPopup`, 팝업이 막히면 `signInWithRedirect` 폴백 | `src/lib/auth/socialSignIn.ts`, `src/components/layout/AuthProvider.tsx` |
| 카카오 | 인가 코드 → 서버 API에서 토큰 교환·사용자 조회 → `firebase-admin` custom token → 클라이언트 `signInWithCustomToken` | `src/app/api/auth/kakao/{start,callback}/route.ts`, `src/app/auth/kakao/page.tsx` |
| 공통 순수 로직(테스트 대상) | 에러 문구, uid 매핑, state 검증, next 경로 정리, 로그인 방식 판별, 카카오 이메일/문서 빈 필드 채우기 | `src/lib/auth/socialAuthCore.ts`, `src/lib/auth/kakaoOAuth.ts`, `src/lib/auth/loginProviders.ts`, `src/lib/server/adminEnv.ts` |

### 카카오 흐름
1. 버튼 → `GET /api/auth/kakao/start` : 랜덤 `state`(32바이트)를 httpOnly 쿠키(10분, path `/api/auth/kakao`)에 저장하고 카카오 인가 화면으로 이동
2. 카카오 → `GET /api/auth/kakao/callback?code&state` : 쿠키 state와 비교(CSRF 방지) → `kauth.kakao.com/oauth/token`으로 토큰 교환(REST 키·Client Secret은 서버 env에서만) → `kapi.kakao.com/v2/user/me`로 회원번호·(검증된 경우에만) 이메일·닉네임 확인 → Firebase Auth 사용자에 비어 있는 email/displayName만 채운 뒤 uid `kakao:{회원번호}`로 custom token 발급
3. `/auth/kakao#token=...` : 토큰은 URL fragment로만 전달(서버 로그에 남지 않음)하고 읽자마자 주소창에서 지운 뒤 `signInWithCustomToken`
4. 처음 가입이면 닉네임(카카오 닉네임 또는 "카카오 사용자")·기본 유령 캐릭터를 설정하고 `users/{uid}` 문서를 이메일 가입과 같은 모양으로 만듭니다. 이미 문서가 있으면 덮어쓰지 않고, 비어 있는 email/nickname만 채웁니다. 검증된 카카오 이메일은 프로필 필드로만 저장합니다.

### 왜 OIDC 공급자가 아니라 custom token인가
- Firebase에서 카카오를 OIDC 공급자로 붙이려면 **Identity Platform 업그레이드(Blaze 요금제 + 사용량 과금)**가 필요하고, 카카오 OIDC 활성화·ID 토큰 nonce 처리 등 콘솔 설정이 늘어납니다.
- custom token 방식은 무료 Spark/Blaze 모두에서 동작하고, 검증 로직이 우리 서버 코드(테스트 가능)에 있어 동작을 눈으로 확인하기 쉽습니다.
- 단점: 서비스 계정 키(Firebase Admin)를 Vercel env로 관리해야 합니다. 나중에 Identity Platform을 쓰게 되면 OIDC로 바꾸는 것도 가능합니다(이 경우 uid가 달라지므로 이전 계획 필요).

### 계정 충돌·연결 정책
- **카카오 계정은 이메일로 기존 계정에 자동 병합하지 않습니다.** 카카오 uid(`kakao:{회원번호}`)로만 계정을 찾습니다. 이메일이 없을 수도 있고, 이메일만으로 합치면 남의 이메일을 쓴 카카오 계정으로 기존 계정을 가로챌 위험이 있기 때문입니다. `kakao_account.email`은 `is_email_valid === true`이고 `is_email_verified === true`일 때만 **프로필 필드**(Firebase Auth email, `users/{uid}.email`)로 저장합니다. Auth에 이미 이메일이 있으면 바꾸지 않습니다. 다른 계정이 그 이메일을 쓰고 있어 `auth/email-already-exists`가 나면 Auth에는 넣지 않고 users 문서에만 저장하며, 로그인은 그대로 성공합니다.
- **구글**은 Firebase가 처리합니다. 같은 이메일이 이미 다른 방법으로 가입돼 있어 `auth/account-exists-with-different-credential`이 나면 「이미 이메일로 가입된 이메일이에요」처럼 안내하고, 구글 자격 증명을 탭 세션 저장소(sessionStorage)에 **10분** 보관합니다. 사용자가 기존 방법(이메일·비밀번호)으로 로그인하면 **두 계정의 이메일이 같을 때만** `linkWithCredential`로 연결합니다.
- 이메일 열거 보호(2023-09 이후 생성된 프로젝트는 기본 켜짐)가 켜져 있으면 `fetchSignInMethodsForEmail`이 빈 배열을 주므로 「이미 다른 방법으로 가입된 이메일이에요」로 안내합니다.
- 참고: Firebase 기본 설정(이메일당 계정 1개)에서는 **이메일 인증을 안 한 이메일/비밀번호 계정**과 같은 구글 이메일로 로그인하면 Firebase가 구글을 신뢰해 같은 계정(uid 유지)으로 로그인시키고 비밀번호 로그인은 해제될 수 있습니다. 데이터는 그대로지만, 원하지 않으면 콘솔에서 정책을 확인하세요.

### 구글: 팝업 vs redirect
- 기본은 **팝업**. 앱 도메인(Vercel)과 `authDomain`(`*.firebaseapp.com`)이 다르면, Safari·iOS·최신 Chrome의 서드파티 저장소 차단 때문에 redirect 방식이 로그인 후 결과를 못 읽는 문제가 있습니다.
- 팝업이 차단(`auth/popup-blocked`)되거나 지원되지 않는 환경(`auth/operation-not-supported-in-environment`, 일부 PWA·인앱 브라우저)에서만 redirect로 폴백합니다. redirect 결과는 항상 마운트돼 있는 `AuthProvider`에서 처리합니다.
- 팝업 닫기·취소는 조용히 무시합니다.
- (선택) redirect까지 안정적으로 쓰려면 Firebase 문서의 "signInWithRedirect 권장사항"대로 `/__/auth/*`를 `https://<프로젝트>.firebaseapp.com/__/auth/*`로 프록시하고 `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`을 앱 도메인으로 바꾸는 방법이 있습니다. 이번 변경에는 넣지 않았습니다.

## 환경 변수

`.env.example`에 키 이름만 있습니다. 실제 값은 `.env.local`과 Vercel에만 넣으세요.

| 키 | 위치 | 설명 |
| --- | --- | --- |
| `KAKAO_REST_API_KEY` | 서버 | 카카오 디벨로퍼스 > 앱 키 > REST API 키 |
| `KAKAO_CLIENT_SECRET` | 서버(선택) | 보안 > Client Secret을 "사용함"으로 켰을 때만 |
| `KAKAO_REDIRECT_URI` | 서버(선택) | 비워 두면 `{현재 주소}/api/auth/kakao/callback` 자동 사용(로컬 포트가 바뀌어도 동작). 고정하고 싶을 때만 설정 |
| `FIREBASE_ADMIN_PROJECT_ID` | 서버 | 서비스 계정 JSON의 `project_id` |
| `FIREBASE_ADMIN_CLIENT_EMAIL` | 서버 | 서비스 계정 JSON의 `client_email` |
| `FIREBASE_ADMIN_PRIVATE_KEY` | 서버 | 서비스 계정 JSON의 `private_key` (한 줄이면 `\n` 그대로 넣어도 됨) |

- 카카오 **JavaScript 키는 필요 없습니다**(SDK 없이 REST로 처리). `NEXT_PUBLIC_` 접두사를 붙이지 마세요.
- env가 없어도 `pnpm build`는 통과합니다(서버 env는 요청 시점에 읽음). 없으면 카카오 버튼을 눌렀을 때 「카카오 로그인이 아직 설정되지 않았어요」가 뜹니다.

## 보미님 체크리스트

### Firebase 콘솔
- [ ] Authentication > 로그인 방법 > **Google 사용 설정**(프로젝트 지원 이메일 선택)
- [ ] Authentication > 설정 > **승인된 도메인**에 `localhost`(기본 포함), Vercel 프로덕션 도메인, 필요하면 프리뷰 도메인 추가
- [ ] 프로젝트 설정 > 서비스 계정 > **새 비공개 키 생성** → JSON 값 3개를 `.env.local`·Vercel env에 입력 (JSON 파일은 레포에 넣지 말 것)
- [ ] (확인) Authentication > 설정 > 사용자 계정 연결: "이메일당 계정 1개" 유지 권장
- [ ] (확인) Firestore 규칙이 로그인 사용자가 `users/{자기 uid}` 문서를 읽고/만들 수 있게 돼 있는지. 카카오 uid는 `kakao:123` 형태라 규칙에서 uid 형식을 제한하고 있다면 조정 필요

### 카카오 디벨로퍼스 (developers.kakao.com)
- [ ] 내 애플리케이션 > 앱 만들기(또는 기존 앱)
- [ ] 앱 설정 > 플랫폼 > **Web 사이트 도메인**: `http://localhost:3000`, `http://localhost:3001`, Vercel 도메인(`https://<도메인>`)
- [ ] 제품 설정 > 카카오 로그인 > **활성화 ON**
- [ ] 카카오 로그인 > **Redirect URI** 등록 (포트까지 정확히 일치해야 함)
  - `http://localhost:3000/api/auth/kakao/callback`
  - `http://localhost:3001/api/auth/kakao/callback`
  - `https://<Vercel 도메인>/api/auth/kakao/callback`
- [ ] 카카오 로그인 > **동의항목**: 닉네임(필수 또는 선택). 이메일은 선택(허용되면 검증된 이메일만 프로필에 저장, 없으면 가입은 그대로 진행)
- [ ] (선택) 보안 > Client Secret 사용 시 `KAKAO_CLIENT_SECRET`에 입력
- [ ] 앱 키 > REST API 키를 `KAKAO_REST_API_KEY`에 입력

### Vercel
- [ ] Project > Settings > Environment Variables에 위 서버 env 5~6개 추가(Production/Preview), 재배포
- [ ] 프리뷰 도메인으로도 테스트하려면 그 도메인을 카카오 Redirect URI·Firebase 승인 도메인에 추가

## 로컬 확인
- `pnpm dev -p 3001` → http://localhost:3001/login, http://localhost:3001/signup
- 키 없이도 버튼 UI·취소·설정 누락 안내는 확인 가능. 실제 로그인은 위 설정 후 가능
