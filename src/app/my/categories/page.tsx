'use client'

import { CATEGORY_CATALOG, isLockedCategory } from '@/app/constants/categories'
import { getCategoryIconSrc } from '@/app/constants/categoryIcons'
import { useAuthStore } from '@/app/store/useAuthStore'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import MyDetailHeader from '../_components/MyDetailHeader'
import MyShell from '../_components/MyShell'
import { useCategoryPreference } from '../_hooks/useCategoryPreference'
import { isCategoryEnabled } from '../_lib/categoryPreference'

const groups = [
  { kind: 'expense', label: '지출' },
  { kind: 'income', label: '수입' },
] as const

export default function CategoriesPage() {
  const { user } = useAuthStore()
  const preference = useCategoryPreference(user?.uid)

  const handleToggle = (
    kind: (typeof groups)[number]['kind'],
    name: string,
    enabled: boolean,
  ) => {
    void preference.setEnabled(kind, name, enabled)
  }

  if (!user) return null

  return (
    <MyShell className="gap-3">
      <MyDetailHeader
        title="카테고리"
        description="기록에 나올 이름만 골라 두어요."
      />

      {preference.error ? (
        <div className="border-border bg-card flex items-center justify-between gap-3 rounded-[18px] border px-3.5 py-3">
          <p className="text-expense text-[12px] font-bold">{preference.error}</p>
          <Button
            type="button"
            variant="outline"
            className="h-8 rounded-full px-3 text-xs shadow-none"
            onClick={preference.retry}
          >
            다시 시도
          </Button>
        </div>
      ) : null}

      {groups.map((group) => (
        <section
          key={group.kind}
          className="border-border bg-card overflow-hidden rounded-[18px] border"
        >
          <h2 className="text-muted px-3.5 pt-3.5 text-[11px] font-bold">
            {group.label}
          </h2>
          <ul>
            {CATEGORY_CATALOG[group.kind].map((item) => {
              const locked = isLockedCategory(item.name)
              const enabled = isCategoryEnabled(
                group.kind,
                item.name,
                preference.overrides,
              )
              const saving = preference.savingKey === `${group.kind}:${item.name}`

              return (
                <li
                  key={`${group.kind}-${item.name}`}
                  className="border-border flex items-center gap-3 border-b px-3.5 py-3 last:border-b-0"
                >
                  <span className="bg-background flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl">
                    <img
                      src={getCategoryIconSrc(item.name)}
                      alt=""
                      className="size-8 object-cover"
                    />
                  </span>
                  <span className="min-w-0 flex-1 text-sm font-extrabold">
                    {item.name}
                  </span>
                  {preference.loading ? (
                    <Skeleton className="h-6 w-11 rounded-full" />
                  ) : (
                    <Switch
                      checked={enabled}
                      disabled={locked || saving}
                      aria-label={
                        locked
                          ? `${item.name}는 항상 사용`
                          : `${item.name} 사용`
                      }
                      onCheckedChange={(checked) =>
                        handleToggle(group.kind, item.name, checked)
                      }
                    />
                  )}
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </MyShell>
  )
}
