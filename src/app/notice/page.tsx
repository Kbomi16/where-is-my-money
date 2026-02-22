'use client'

import * as React from 'react'
import {
  Search,
  Megaphone,
  AlertCircle,
  ExternalLink,
  Loader2,
  HeadphonesIcon,
} from 'lucide-react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

import { db } from '@/lib/firebase'
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore'
import { Notice } from '../type/notice.type'
import { useEffect, useState } from 'react'

const isWithinAWeek = (dateString: string) => {
  try {
    const noticeDate = new Date(dateString)
    const today = new Date()

    // 두 날짜의 차이 (밀리초 단위)
    const diffTime = today.getTime() - noticeDate.getTime()
    // 밀리초를 일(day) 단위로 변환
    const diffDays = diffTime / (1000 * 60 * 60 * 24)

    // 0일보다 크고(미래 게시글 방지) 7일보다 작거나 같은 경우 true
    return diffDays >= 0 && diffDays <= 7
  } catch (error) {
    return false
  }
}

export default function NoticePage() {
  const [notices, setNotices] = useState<Notice[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    // notices 컬렉션을 날짜 내림차순으로 정렬하여 가져옴
    const q = query(collection(db, 'notices'), orderBy('date', 'desc'))

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const noticeList: Notice[] = []
        querySnapshot.forEach((doc) => {
          noticeList.push({ id: doc.id, ...doc.data() } as Notice)
        })
        setNotices(noticeList)
        setLoading(false)
      },
      (error) => {
        console.error('Firestore Error:', error)
        setLoading(false)
      },
    )

    return () => unsubscribe()
  }, [])

  // 검색 필터링
  const filteredNotices = notices.filter(
    (notice) =>
      notice.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notice.category.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 base-layout min-h-[calc(100vh-64px)] py-6 duration-500 lg:py-12">
      <div className="mx-auto pb-10">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
          <Megaphone size={28} />
        </div>
        <h1 className="text-3xl font-black tracking-tight text-slate-900 md:text-4xl dark:text-slate-50">
          공지사항
        </h1>
        <p className="mt-3 text-slate-500 dark:text-slate-400">
          서비스의 새로운 소식과 안내를 전해드립니다.
        </p>
      </div>

      {/* 2. 검색창 */}
      <div className="group relative mb-8">
        <Search
          className="absolute top-1/2 left-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-blue-500"
          size={20}
        />
        <Input
          placeholder="궁금한 소식을 검색해보세요"
          className="h-14 rounded-2xl border-slate-200 bg-white pl-12 shadow-sm focus-visible:ring-blue-500 dark:border-slate-800 dark:bg-slate-950"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* 3. 공지사항 리스트 (아코디언) */}
      <div className="rounded-4xl border border-slate-100 bg-white p-2 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400">
            <Loader2 className="mb-4 h-10 w-10 animate-spin text-blue-500" />
            <p className="text-sm font-medium">데이터를 불러오는 중입니다...</p>
          </div>
        ) : filteredNotices.length > 0 ? (
          <Accordion type="single" collapsible className="w-full">
            {filteredNotices.map((notice) => {
              const showNewBadge = isWithinAWeek(notice.date)

              return (
                <AccordionItem
                  key={notice.id}
                  value={notice.id}
                  className="mb-1 border-none px-4 py-1 last:mb-0"
                >
                  <AccordionTrigger className="group py-5 hover:no-underline">
                    <div className="flex flex-col items-start gap-2 text-left">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="secondary"
                          className={cn(
                            'h-5 px-1.5 text-xs font-bold',
                            notice.category === '업데이트' &&
                              'bg-orange-50 text-orange-600',
                            notice.category === '공지' &&
                              'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
                          )}
                        >
                          {notice.category}
                        </Badge>
                        {/* 조건부 렌더링: 일주일 이내일 때만 노출 */}
                        {showNewBadge && (
                          <div className="flex items-center gap-1 text-[10px] font-bold text-blue-500">
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-500" />
                            NEW
                          </div>
                        )}
                      </div>
                      <span className="text-base font-bold text-slate-800 transition-colors group-hover:text-blue-600 md:text-lg dark:text-slate-200">
                        {notice.title}
                      </span>
                      <span className="text-xs font-medium text-slate-400">
                        {notice.date}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-1 pt-2 pb-6">
                    <div className="rounded-2xl bg-slate-50 p-5 text-sm leading-relaxed text-slate-600 md:text-base dark:bg-slate-800/40 dark:text-slate-400">
                      <div
                        className="notice-content text-sm text-slate-600 md:text-base dark:text-slate-400"
                        dangerouslySetInnerHTML={{ __html: notice.content }}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )
            })}
          </Accordion>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400">
            <AlertCircle size={48} className="mb-4 opacity-10" />
            <p className="text-sm font-medium">
              검색어와 일치하는 소식이 없어요.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
