'use client'

import { User } from 'firebase/auth'
import { Card, CardContent } from '@/components/ui/card'
import {
  Mail,
  Calendar,
  Fingerprint,
  ChevronRight,
  MessageCircleQuestionMark,
} from 'lucide-react'

export default function AccountSection({ user }: { user: User }) {
  return (
    <Card className="overflow-hidden rounded-4xl border-none bg-white/40 shadow-xl backdrop-blur-md dark:bg-slate-900/40">
      <CardContent className="p-0">
        <div className="flex flex-col">
          {/* 상단 헤더 부분 - 닉네임 강조 */}
          <div className="border-b border-[#1677ff]/10 bg-[#1677ff]/5 p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1677ff] text-white shadow-lg shadow-[#1677ff]/20">
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
                    {user.email}
                  </p>
                </div>
              </div>
              <ChevronRight className="size-4 text-slate-300" />
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
