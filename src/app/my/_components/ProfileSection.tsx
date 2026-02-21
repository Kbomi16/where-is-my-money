'use client'

import { useEffect, useState } from 'react'
import { User, updateProfile } from 'firebase/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import Image from 'next/image'
import { GHOST_IMAGES, GhostId } from '@/app/constants/ghosts'
import { Save, Check } from 'lucide-react'

export default function ProfileSection({ user }: { user: User }) {
  const [isUpdating, setIsUpdating] = useState(false)

  // 1. 현재 선택(프리뷰) 중인 캐릭터 상태 (초기값은 현재 유저의 photoURL)
  const [selectedGhostId, setSelectedGhostId] = useState<string | null>(
    user.photoURL || GHOST_IMAGES[0].id,
  )

  useEffect(() => {
    if (user.photoURL) {
      setSelectedGhostId(user.photoURL)
    }
  }, [user.photoURL])

  // 프리뷰로 보여줄 이미지 찾기
  const previewGhost =
    GHOST_IMAGES.find((g) => g.id === selectedGhostId) || GHOST_IMAGES[0]

  // 실제 변경사항이 있는지 확인 (저장 버튼 활성화용)
  const isChanged = selectedGhostId !== user.photoURL

  const handleSave = async () => {
    if (!selectedGhostId || !isChanged) return

    setIsUpdating(true)
    try {
      await updateProfile(user, { photoURL: selectedGhostId })
      toast.success('프로필 수정 완료!', {
        description: '새로운 프로필이 저장되었어요.',
      })
    } catch (error) {
      toast.error('저장에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <Card className="overflow-hidden rounded-4xl border-none bg-white/60 shadow-xl backdrop-blur-xl dark:bg-slate-900/60">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl font-bold">프로필 수정</CardTitle>
        {isChanged && (
          <span className="text-accent animate-pulse text-[11px] font-bold">
            변경됨
          </span>
        )}
      </CardHeader>

      <CardContent className="space-y-8">
        {/* 중앙 프리뷰 영역 */}
        <div className="flex justify-center py-4">
          <div className="group relative">
            <div className="relative rounded-4xl bg-white p-6 shadow-[0_10px_40px_rgba(0,0,0,0.05)] transition-all duration-500 dark:bg-slate-800">
              <Image
                key={previewGhost.id}
                src={previewGhost.src}
                alt="Preview Ghost"
                width={120}
                height={120}
                className="object-contain"
              />
            </div>
            <div className="bg-accent absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full px-4 py-1.5 text-xs font-bold text-white shadow-lg">
              {user.displayName}
            </div>
          </div>
        </div>

        {/* 그리드 선택 영역 */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {GHOST_IMAGES.map((ghost) => {
              const isSelected = selectedGhostId === ghost.id
              return (
                <button
                  key={ghost.id}
                  onClick={() => setSelectedGhostId(ghost.id)}
                  className={`relative flex aspect-square flex-col items-center justify-center rounded-3xl border-2 transition-all active:scale-95 ${
                    isSelected
                      ? 'border-accent bg-accent/5 shadow-sm'
                      : 'border-slate-100 bg-slate-50/50 hover:border-slate-200 dark:border-slate-800 dark:bg-slate-800/50'
                  }`}
                >
                  {isSelected && (
                    <div className="bg-accent absolute top-2 right-2 rounded-full p-0.5">
                      <Check className="size-3 text-white" />
                    </div>
                  )}
                  <Image
                    src={ghost.src}
                    alt={ghost.label}
                    width={56}
                    height={56}
                    className={`mb-1 transition-opacity ${!isSelected && 'opacity-60 hover:opacity-100'}`}
                  />
                  <span
                    className={`text-[10px] font-bold ${isSelected ? 'text-accent' : 'text-slate-400'}`}
                  >
                    {ghost.label}
                  </span>
                </button>
              )
            })}
          </div>

          {/* 저장 버튼 */}
          <Button
            onClick={handleSave}
            disabled={!isChanged || isUpdating}
            className={`h-14 w-full rounded-2xl text-base font-bold shadow-lg transition-all duration-300 ${
              isChanged
                ? 'bg-accent shadow-accent/20 hover:bg-accent/90 text-white'
                : 'bg-slate-100 text-slate-400'
            }`}
          >
            {isUpdating ? (
              <span className="flex items-center gap-2">저장 중...</span>
            ) : (
              <span className="flex items-center gap-2">
                <Save className="size-5" />
                변경사항 저장하기
              </span>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
