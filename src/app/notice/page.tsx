'use client'

import * as React from 'react'
import { Search, Megaphone, AlertCircle, Loader2, X } from 'lucide-react'
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
    const diffTime = today.getTime() - noticeDate.getTime()
    const diffDays = diffTime / (1000 * 60 * 60 * 24)
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

  const filteredNotices = notices.filter(
    (notice) =>
      notice.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notice.category.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 base-layout mx-auto min-h-[calc(100vh-64px)] max-w-4xl px-4 py-8 duration-500 lg:py-16">
      {/* 1. 헤더 섹션 */}
      <div className="mb-10 text-center md:text-left">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 shadow-sm ring-1 ring-blue-100/50 md:mx-0 dark:bg-blue-950/40 dark:text-blue-400 dark:ring-blue-900/30">
          <Megaphone
            size={26}
            className="animate-bounce"
            style={{ animationDuration: '3s' }}
          />
        </div>
        <h1 className="text-3xl font-black tracking-tight text-slate-900 md:text-4xl dark:text-slate-50">
          공지사항
        </h1>
        <p className="mt-2.5 text-sm text-slate-500 md:text-base dark:text-slate-400">
          서비스의 새로운 소식과 안내를 전해드립니다.
        </p>
      </div>

      {/* 2. 검색 바 */}
      <div className="group relative mb-8">
        <Search className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-blue-500 dark:text-slate-500 dark:group-focus-within:text-blue-400" />
        <Input
          placeholder="궁금한 소식을 검색해보세요"
          className="h-14 rounded-2xl border-slate-200 bg-white pr-12 pl-12 shadow-sm transition-all focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus-visible:ring-blue-400"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <Button
            size="icon"
            variant="ghost"
            className="absolute top-1/2 right-3 h-8 w-8 -translate-y-1/2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-300"
            onClick={() => setSearchQuery('')}
          >
            <X size={16} />
          </Button>
        )}
      </div>

      {/* 3. 공지사항 리스트 */}
      <div className="rounded-3xl border border-slate-100 bg-white p-2 shadow-sm backdrop-blur-sm dark:border-slate-800/60 dark:bg-slate-900/40">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400 dark:text-slate-500">
            <Loader2 className="mb-4 h-8 w-8 animate-spin text-blue-500 dark:text-blue-400" />
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              데이터를 불러오는 중입니다...
            </p>
          </div>
        ) : filteredNotices.length > 0 ? (
          <Accordion type="single" collapsible className="w-full">
            {filteredNotices.map((notice) => {
              const showNewBadge = isWithinAWeek(notice.date)

              return (
                <AccordionItem
                  key={notice.id}
                  value={notice.id}
                  className="overflow-hidden rounded-2xl border-b border-slate-100 transition-colors last:border-none hover:bg-slate-50/50 dark:border-slate-800/60 dark:hover:bg-slate-800/30"
                >
                  <AccordionTrigger className="group px-4 py-5 hover:no-underline data-[state=open]:bg-slate-50/30 dark:data-[state=open]:bg-slate-800/20">
                    <div className="flex w-full flex-col items-start gap-2.5 pr-4 text-left">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="secondary"
                          className={cn(
                            'h-5 rounded-md px-2 text-[11px] font-bold tracking-wide transition-colors',
                            notice.category === '업데이트' &&
                              'bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400',
                            notice.category === '공지' &&
                              'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
                          )}
                        >
                          {notice.category}
                        </Badge>
                        {showNewBadge && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
                            <span className="h-1 w-1 animate-pulse rounded-full bg-blue-500 dark:bg-blue-400" />
                            NEW
                          </span>
                        )}
                      </div>
                      <span className="line-clamp-2 text-base font-semibold text-slate-800 transition-colors group-hover:text-blue-600 md:text-lg dark:text-slate-200 dark:group-hover:text-blue-400">
                        {notice.title}
                      </span>
                      <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
                        {notice.date}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="p-0">
                    <div className="border-t border-slate-100/50 bg-slate-50/50 px-5 py-6 dark:border-slate-800/40 dark:bg-slate-950/30">
                      <div
                        className="notice-content prose dark:prose-invert prose-slate dark:prose-neutral prose-a:text-blue-600 dark:prose-a:text-blue-400 hover:prose-a:underline max-w-none text-sm leading-relaxed text-slate-600 md:text-base dark:text-slate-300"
                        dangerouslySetInnerHTML={{ __html: notice.content }}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )
            })}
          </Accordion>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400 dark:text-slate-500">
            <div className="mb-4 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/40">
              <AlertCircle
                size={32}
                className="text-slate-300 dark:text-slate-600"
              />
            </div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              검색어와 일치하는 소식이 없어요.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
