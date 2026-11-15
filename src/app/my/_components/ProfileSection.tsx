'use client'

import { useEffect, useState } from 'react'
import { User, updateProfile } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input, formFieldClassName } from '@/components/ui/input'
import { toast } from 'sonner'
import Image from 'next/image'
import { GHOST_IMAGES } from '@/app/constants/ghosts'
import { Save, Check } from 'lucide-react'
import { auth, db } from '@/lib/firebase'
import { useAuthStore } from '@/app/store/useAuthStore'
import { MAX_NICKNAME_LENGTH } from '@/lib/auth/socialAuthCore'

export default function ProfileSection({ user }: { user: User }) {
  const [nickname, setNickname] = useState(user.displayName ?? '')
  const [isUpdating, setIsUpdating] = useState(false)
  const [selectedGhostId, setSelectedGhostId] = useState<string | null>(
    user.photoURL || GHOST_IMAGES[0].id,
  )

  const setUser = useAuthStore((state) => state.setUser)

  useEffect(() => {
    setNickname(user.displayName ?? '')
  }, [user.displayName])

  useEffect(() => {
    if (user.photoURL) {
      setSelectedGhostId(user.photoURL)
    }
  }, [user.photoURL])

  const previewGhost =
    GHOST_IMAGES.find((ghost) => ghost.id === selectedGhostId) ||
    GHOST_IMAGES[0]
  const trimmedNickname = nickname.trim()
  const nameChanged = trimmedNickname !== (user.displayName ?? '')
  const isChanged = nameChanged || selectedGhostId !== user.photoURL

  const handleSave = async () => {
    if (!selectedGhostId || !isChanged || isUpdating) return
    if (trimmedNickname.length < 2) {
      toast.error('닉네임은 최소 2자 이상이어야 해요!')
      return
    }

    setIsUpdating(true)
    try {
      await updateProfile(user, {
        displayName: trimmedNickname,
        photoURL: selectedGhostId,
      })
      await setDoc(
        doc(db, 'users', user.uid),
        { nickname: trimmedNickname, photoURL: selectedGhostId },
        { merge: true },
      )
      await user.reload()
      setUser(auth.currentUser)
      toast.success('프로필을 저장했어요.')
    } catch {
      toast.error('저장에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <Card className="overflow-hidden rounded-4xl border-none bg-white/60 backdrop-blur-xl dark:bg-slate-900/60">
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
        <div className="flex w-full min-w-0 flex-col items-center gap-4 py-4">
          <div className="rounded-4xl bg-white p-6 dark:bg-slate-800">
            <Image
              key={previewGhost.id}
              src={previewGhost.src}
              alt="Preview Ghost"
              width={120}
              height={120}
              className="object-contain"
            />
          </div>
          <p className="bg-accent max-w-full min-w-0 truncate rounded-full px-4 py-1.5 text-xs font-bold whitespace-nowrap text-white">
            {nickname.trim() || '이름 없음'}
          </p>
        </div>

        <div>
          <div className="flex flex-col gap-3">
            <label htmlFor="profile-nickname" className="text-sm font-bold">
              닉네임
            </label>
            <Input
              id="profile-nickname"
              value={nickname}
              maxLength={MAX_NICKNAME_LENGTH}
              autoComplete="nickname"
              onChange={(event) => setNickname(event.currentTarget.value)}
              className={formFieldClassName}
              aria-describedby="profile-nickname-hint"
            />
          </div>
          <p
            id="profile-nickname-hint"
            className="text-muted mt-2 text-[11px] font-medium"
          >
            2자 이상, 20자까지 쓸 수 있어요.
          </p>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
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
