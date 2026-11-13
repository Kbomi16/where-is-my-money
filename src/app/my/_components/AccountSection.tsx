'use client'

import { User } from 'firebase/auth'
import { Card, CardContent } from '@/components/ui/card'
import {
  Mail,
  Calendar,
  Fingerprint,
  MessageCircleQuestionMark,
} from 'lucide-react'
import {
  loginProviderLabel,
  resolveAccountEmail,
  resolveLoginProviders,
} from '@/lib/auth/loginProviders'
import { useUserAccountEmail } from '../_hooks/useUserAccountEmail'

export default function AccountSection({ user }: { user: User }) {
  const { email: docEmail, loading: docEmailLoading } = useUserAccountEmail(
    user.uid,
  )
  const displayEmail = resolveAccountEmail(user.email, docEmail)
  const emailText = displayEmail
    ? displayEmail
    : docEmailLoading && !user.email
      ? '불러오는 중...'
      : '이메일 없음'
  const providers = resolveLoginProviders({
    uid: user.uid,
    providerData: user.providerData,
  })

  return (
    <Card className="overflow-hidden rounded-4xl border-none bg-white/40 backdrop-blur-md dark:bg-slate-900/40">
      <CardContent className="p-0">
        <div className="flex flex-col">
          {/* 상단 헤더 부분 - 닉네임 강조 */}
          <div className="border-b border-[#1677ff]/10 bg-[#1677ff]/5 p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1677ff] text-white">
                <MessageCircleQuestionMark className="size-6" />
              </div>
              <div>
                <p className="text-[11px] font-bold tracking-wider text-[#1677ff]/70 uppercase">
                  나의 닉네임
                </p>
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                  {user.displayName || '이름 없음'}
                </h3>
              </div>
            </div>
          </div>

          {/* 상세 정보 리스트 */}
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {/* 이메일 정보 */}
            <div className="flex items-center justify-between p-5 transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                  <Mail className="size-5" />
                </div>
                <div>
                  <p className="text-[10px] font-medium text-slate-400">
                    이메일 주소
                  </p>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    {emailText}
                  </p>
                </div>
              </div>
            </div>

            {/* 로그인 방식 */}
            <div className="flex items-center justify-between p-5 transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                  <Fingerprint className="size-5" />
                </div>
                <div>
                  <p className="text-[10px] font-medium text-slate-400">
                    로그인 방식
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {providers.length === 0 ? (
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                        알 수 없음
                      </p>
                    ) : (
                      providers.map((provider) => (
                        <span
                          key={provider}
                          className="bg-accent/10 text-accent inline-block rounded-full px-2 py-0.5 text-[10px] font-bold"
                        >
                          {loginProviderLabel(provider)}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 가입일 정보 */}
            <div className="flex items-center justify-between p-5 transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                  <Calendar className="size-5" />
                </div>
                <div>
                  <p className="text-[10px] font-medium text-slate-400">
                    가입일
                  </p>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    {new Date(user.metadata.creationTime!).toLocaleDateString(
                      'ko-KR',
                      {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      },
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
