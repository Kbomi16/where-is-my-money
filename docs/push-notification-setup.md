# 기록 리마인더 푸시 (FCM 웹 푸시) 설정

하루 세 번(KST 9시·13시·19시), 직전 슬롯 이후 기록이 하나도 없는 사용자에게만 「🍚 점심 맛있게 먹었어요?」 같은 리마인더를 보냅니다.
(예전의 「지출 저장 즉시 알림」(`/api/push/expense`)은 없앴습니다.)

## 동작 흐름

1. **설정 화면 토글** (`/my/settings` 「푸시 알림」)
   - 지원 여부 확인 (`src/lib/push/pushCore.ts` `resolvePushSupport`)
     - iOS·iPadOS는 Safari에서 「홈 화면에 추가」로 설치한 앱(PWA)에서만 웹 푸시가 됩니다. 브라우저 탭에서는 안내 문구만 보여 줍니다.
     - Notification / ServiceWorker / PushManager / `firebase/messaging isSupported()` 중 하나라도 없으면 「지원하지 않아요」.
     - `NEXT_PUBLIC_FIREBASE_VAPID_KEY`가 비어 있으면 「설정(VAPID 키)이 아직 없어요」.
   - `Notification.requestPermission()` → 거부하면 「브라우저 사이트 설정에서 알림을 허용해 주세요」.
   - `/firebase-messaging-sw.js?v=<SDK 버전>&apiKey=...` 를 scope `/firebase-cloud-messaging-push-scope` 로 등록
     (Firebase 웹 config는 레포에 하드코딩하지 않고 등록 URL 쿼리스트링으로 전달, 페이지 요청은 가로채지 않음).
   - `getToken(messaging, { vapidKey, serviceWorkerRegistration })` 으로 FCM 토큰 발급.
   - `POST /api/push/token` (Authorization: Bearer Firebase ID 토큰) → Admin SDK가 `users/{uid}/fcmTokens/{sha256(token)}` 에 저장.
   - 끄면 `deleteToken` + `DELETE /api/push/token` 으로 문서 삭제.
2. **리마인더 크론** (`GET /api/cron/reminder`, 자세한 내용은 아래 「리마인더」)
3. **서비스 워커** (`public/firebase-messaging-sw.js`)
   - 백그라운드(앱 탭이 보이지 않을 때) 메시지를 받아 직접 알림을 띄우고, 클릭하면 열린 앱 탭으로 이동하거나 새 창을 엽니다.
4. **포그라운드** (`src/components/layout/PushForegroundListener.tsx` → `pushClient.listenForegroundMessages`)
   - 앱 탭이 화면에 떠 있으면 FCM SDK가 SW 대신 페이지 `onMessage`로 넘깁니다. 이때 메시징 SW 등록(`getRegistration(PUSH_SW_SCOPE)`)의 `showNotification`으로 직접 띄웁니다.
   - 한 메시지는 백그라운드·포그라운드 중 한쪽으로만 오고, 탭이 여러 개여도 `tag: reminder:<slotKey>`가 같아 알림이 하나로 합쳐집니다.

Firestore 보안 규칙 변경은 필요 없습니다. 토큰 저장·조회는 모두 Admin SDK(서버)에서 합니다.

## 1. VAPID 키(웹 푸시 인증서) 발급

1. Firebase 콘솔 → 프로젝트 설정 → **클라우드 메시징** 탭
2. 「Firebase Cloud Messaging API (V1)」이 사용 설정인지 확인
3. 아래쪽 **웹 구성 → 웹 푸시 인증서 → 키 쌍 생성**
4. 생성된 **공개 키**를 `NEXT_PUBLIC_FIREBASE_VAPID_KEY` 에 넣습니다. (비공개 키는 필요 없음)

## 2. 환경 변수

| 이름 | 위치 | 설명 |
| --- | --- | --- |
| `NEXT_PUBLIC_FIREBASE_VAPID_KEY` | 클라이언트(새로 추가) | 웹 푸시 인증서 공개 키 |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | 클라이언트(기존) | 서비스 워커 초기화에 필요 |
| `NEXT_PUBLIC_FIREBASE_API_KEY` / `_PROJECT_ID` / `_APP_ID` 등 | 클라이언트(기존) | 서비스 워커에도 쿼리스트링으로 전달 |
| `FIREBASE_ADMIN_PROJECT_ID` / `FIREBASE_ADMIN_CLIENT_EMAIL` / `FIREBASE_ADMIN_PRIVATE_KEY` | 서버(기존) | ID 토큰 검증, 토큰 저장, 발송에 그대로 사용 |
| `CRON_SECRET` | 서버(새로 추가) | 크론 라우트 보호. Vercel이 `Authorization: Bearer <값>`으로 자동 첨부 (`openssl rand -hex 32`) |

로컬은 `.env.local`, 배포는 Vercel 프로젝트 환경 변수에 넣습니다. `NEXT_PUBLIC_` 값은 빌드 시점에 들어가므로 바꾼 뒤 다시 빌드·배포해야 합니다.

## 3. 로컬 테스트

1. `.env.local` 에 위 값을 넣고 `pnpm dev` (localhost는 HTTPS가 아니어도 서비스 워커·푸시가 허용됩니다)
2. 로그인 → `/my/settings` → 「푸시 알림」 켜기 → 브라우저 권한 허용
3. 개발자 도구 → Application → Service Workers 에 `firebase-messaging-sw.js` (scope `/firebase-cloud-messaging-push-scope`) 확인
4. Firestore `users/{uid}/fcmTokens` 에 문서가 생겼는지 확인
5. 아래 「리마인더 로컬 테스트」 curl로 발송 → 탭을 보고 있을 때·다른 탭일 때 모두 OS 알림 확인
6. 끄기 → `fcmTokens` 문서가 지워졌는지 확인

API 빠른 점검(인증 없으면 401):

```bash
curl -i -X POST localhost:3000/api/push/token -H 'Content-Type: application/json' -d '{"token":"x"}'
curl -i localhost:3000/api/cron/reminder   # CRON_SECRET 헤더 없으면 401
```

## 문제 해결

- 토글이 비활성 + 「설정(VAPID 키)이 아직 없어요」: `NEXT_PUBLIC_FIREBASE_VAPID_KEY` 누락 → 넣고 dev 서버 재시작
- 「알림이 차단돼 있어요」: 주소창 사이트 설정에서 알림을 「허용」으로 바꾼 뒤 새로고침
- `/api/push/*` 가 503 `push_config`: 서버의 `FIREBASE_ADMIN_*` 누락
- 알림이 안 뜸: macOS는 시스템 설정 → 알림에서 브라우저 알림 허용 여부, 집중 모드(방해 금지)도 확인
- 크론이 401: `CRON_SECRET` 누락 또는 헤더 값 불일치 (서버에 값이 없으면 모든 요청을 401로 거부)
- `tsc`가 `.next/types/validator.ts`에서 지워진 라우트를 못 찾는다고 실패: 예전 `next build`가 만든 타입이 남은 것 → 다시 빌드하면 갱신

## 리마인더 (시간대별 기록 알림)

| 슬롯 | KST | UTC (vercel.json) | 기록 확인 구간 | 문구 (title / body) |
| --- | --- | --- | --- | --- |
| morning | 09:00 | `0 0 * * *` | 전날 19:00 ~ 지금 | ☀️ 좋은 아침! 벌써 뭐 샀어요? / 커피값도 소중하니까 살짝 남겨 둬요 ☕ |
| lunch | 13:00 | `0 4 * * *` | 09:00 ~ 지금 | 🍚 점심 맛있게 먹었어요? / 얼마였는지 까먹기 전에 콕 기록해요! |
| evening | 19:00 | `0 10 * * *` | 13:00 ~ 지금 | 🌙 오늘 내 돈 어디 갔지? / 오늘 쓴 돈, 자기 전에 정리해 볼까요? |

- 시간·문구는 `src/lib/push/reminderCore.ts`의 `REMINDER_SLOTS`, `REMINDER_COPY` 한 곳에서 고칩니다 (시간을 바꾸면 `vercel.json`의 UTC도 같이).
- 알림을 누르면 홈(`/`)이 열립니다 (오른쪽 아래 + 버튼으로 바로 기록).
- **Vercel Cron 제약** (https://vercel.com/docs/cron-jobs/usage-and-pricing): Hobby는 크론마다 하루 1번만, 실행 시각은 정시~59분 사이(±59분). 그래서 하루 1번짜리 크론 3개로 나눴고, 서버는 「시작 시각 <= 지금」인 가장 최근 슬롯을 고릅니다(13:59에 불려도 lunch). 슬롯 시작 3시간 넘게 지나 불리면 `outside_slot`으로 건너뜁니다(`?slot=` 지정 시 제외).
- **대상**: `collectionGroup('fcmTokens')`(필터 없음 → 색인 불필요)로 알림 켠 사용자 → `transactions`를 `createdAt` 단일 필드 범위로 한 번 조회해 구간 안에 기록한 uid를 제외. 앱이 자동 생성한 반복 지출 회차(`recurringParentId` 있음)는 기록으로 치지 않습니다. 복합 색인 필요 없음.
- **중복 방지**: `users/{uid}/pushState/reminder.lastSlotKey`(예: `2026-11-16:lunch`)를 트랜잭션으로 선점한 뒤 발송 → 크론이 두 번 불려도 슬롯당 1번. Admin SDK 전용이라 Firestore 규칙 변경 없음.
- 발송은 data 전용 `sendEachForMulticast`, 무효 토큰은 삭제, TTL 4시간.

### 리마인더 로컬 테스트

`.env.local`에 `CRON_SECRET=<무작위 값>`을 넣고 dev 서버에서 (모든 쿼리도 같은 헤더가 필요):

```bash
curl -i localhost:3000/api/cron/reminder                                   # 401
curl -s -H "Authorization: Bearer $CRON_SECRET" "localhost:3000/api/cron/reminder?dryRun=1"            # 지금 슬롯 대상만 계산
curl -s -H "Authorization: Bearer $CRON_SECRET" "localhost:3000/api/cron/reminder?slot=lunch&dryRun=1" # 슬롯 지정
curl -s -H "Authorization: Bearer $CRON_SECRET" "localhost:3000/api/cron/reminder?slot=lunch&force=1"  # 실제 발송(중복 방지 무시)
```

- `slot=morning|lunch|evening`: 그 슬롯의 가장 최근 시작(오늘 아직 안 됐으면 어제)으로 계산
- `dryRun=1`: 발송·`lastSlotKey` 기록 없이 `would_send` / `already_sent`만 돌려줌
- `force=1`: 이미 보낸 슬롯이어도 다시 보냄
- 응답 예: `{"slot":"lunch","slotKey":"2026-11-16:lunch","window":{"fromKst":"2026-11-16 09:00","toKst":"..."},"usersWithTokens":1,"recordedInWindow":0,"users":[{"uid":"abcd…","tokens":1,"status":"sent","successCount":1,"failureCount":0,"removed":0}]}` (uid는 앞 4자만)

### 배포 시 할 일 (보미님)

1. Vercel 프로젝트 환경 변수에 `CRON_SECRET` 추가 (Production)
2. 배포하면 `vercel.json`의 크론 3개가 등록됩니다 (Vercel 대시보드 → Settings → Cron Jobs에서 확인·수동 실행 가능)
