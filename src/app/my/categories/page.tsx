'use client'

import { CATEGORIES } from '@/app/constants/categories'
import { getCategoryIconSrc } from '@/app/constants/categoryIcons'
import { useAuthStore } from '@/app/store/useAuthStore'
import MyDetailHeader from '../_components/MyDetailHeader'
import MyShell from '../_components/MyShell'

// TODO: 사용자 정의 카테고리 저장이 없습니다. constants/categories.ts 목록만 보여 줍니다.

const groups = [
  { label: '지출', items: CATEGORIES.expense },
  { label: '수입', items: CATEGORIES.income },
] as const

export default function CategoriesPage() {
  const { user } = useAuthStore()

  if (!user) return null

  return (
    <MyShell className="gap-3">
      <MyDetailHeader title="카테고리" />
      <p className="text-muted text-xs font-medium">
        기록에 쓰는 기본 분류예요. 직접 추가하는 기능은 아직 없어요.
      </p>

      {groups.map((group) => (
        <section
          key={group.label}
          className="border-border bg-card overflow-hidden rounded-[18px] border"
        >
          <h2 className="text-muted px-3.5 pt-3.5 text-[11px] font-bold">
            {group.label}
          </h2>
          <ul>
            {group.items.map((category) => (
              <li
                key={`${group.label}-${category}`}
                className="border-border flex items-center gap-3 border-b px-3.5 py-3 last:border-b-0"
              >
                <span className="bg-background flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl">
                  <img
                    src={getCategoryIconSrc(category)}
                    alt=""
                    className="size-8 object-cover"
                  />
                </span>
                <span className="text-sm font-extrabold">{category}</span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </MyShell>
  )
}
