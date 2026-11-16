import type { NextRequest } from 'next/server'
import { isCronAuthorized, parseFlag, parseReminderSlot } from '@/lib/push/reminderCore'
import { MissingAdminEnvError } from '@/lib/server/firebaseAdmin'
import { runReminders } from '@/lib/server/pushReminders'
import { jsonNoStore } from '@/lib/server/verifyRequestUser'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * Vercel Cron (vercel.json crons) → 하루 세 번 KST 9·13·19시 기록 리마인더.
 * Vercel이 `Authorization: Bearer ${CRON_SECRET}` 를 붙여 GET으로 호출한다.
 * 로컬 테스트 쿼리 (모두 같은 헤더 필요):
 *   ?slot=morning|lunch|evening  슬롯 강제 지정
 *   ?dryRun=1                    대상만 계산 (발송·중복 방지 기록 안 함)
 *   ?force=1                     이미 보낸 슬롯이어도 다시 보냄
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret?.trim()) console.error('[reminder] CRON_SECRET 이 설정되지 않아 모든 요청을 거부해요.')
  if (!isCronAuthorized(request.headers.get('authorization'), secret)) {
    return jsonNoStore({ error: 'unauthorized' }, 401)
  }

  const params = request.nextUrl.searchParams
  const slotParam = params.get('slot')
  const slot = parseReminderSlot(slotParam)
  if (slotParam && !slot) return jsonNoStore({ error: 'invalid_slot' }, 400)

  try {
    const result = await runReminders({
      slot,
      dryRun: parseFlag(params.get('dryRun')),
      force: parseFlag(params.get('force')),
    })
    return jsonNoStore(result, 200)
  } catch (error) {
    if (error instanceof MissingAdminEnvError) {
      console.error('[reminder] Firebase Admin env 없음:', error.missing.join(', '))
      return jsonNoStore({ error: 'push_config' }, 503)
    }
    console.error('[reminder] 실행 실패', error)
    return jsonNoStore({ error: 'reminder_failed' }, 500)
  }
}
