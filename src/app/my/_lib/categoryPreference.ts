import {
  CATEGORY_CATALOG,
  isLockedCategory,
  type CategoryKind,
} from '@/app/constants/categories'

export type CategoryOverrides = {
  expense: Record<string, boolean>
  income: Record<string, boolean>
}

export const emptyCategoryOverrides = (): CategoryOverrides => ({
  expense: {},
  income: {},
})

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value)

export const readCategoryOverrides = (value: unknown): CategoryOverrides => {
  const next = emptyCategoryOverrides()
  if (!isRecord(value)) return next

  for (const kind of ['expense', 'income'] as const) {
    const group = value[kind]
    if (!isRecord(group)) continue

    for (const item of CATEGORY_CATALOG[kind]) {
      if (isLockedCategory(item.name)) continue
      const flag = group[item.name]
      if (typeof flag === 'boolean' && flag !== item.defaultEnabled) {
        next[kind][item.name] = flag
      }
    }
  }

  return next
}

export const isCategoryEnabled = (
  kind: CategoryKind,
  name: string,
  overrides: CategoryOverrides,
) => {
  if (isLockedCategory(name)) return true
  const item = CATEGORY_CATALOG[kind].find((entry) => entry.name === name)
  if (!item) return false
  const override = overrides[kind][name]
  return typeof override === 'boolean' ? override : item.defaultEnabled
}

export const categoriesForSelect = (
  kind: CategoryKind,
  overrides: CategoryOverrides,
  selected?: string,
) => {
  const enabled = CATEGORY_CATALOG[kind]
    .filter((item) => isCategoryEnabled(kind, item.name, overrides))
    .map((item) => item.name)

  if (
    selected &&
    !enabled.includes(selected) &&
    CATEGORY_CATALOG[kind].some((item) => item.name === selected)
  ) {
    return CATEGORY_CATALOG[kind]
      .map((item) => item.name)
      .filter((name) => enabled.includes(name) || name === selected)
  }

  return enabled
}

export const categoriesForSpendList = (
  kind: CategoryKind,
  overrides: CategoryOverrides,
  spentByName: Map<string, number>,
) =>
  CATEGORY_CATALOG[kind]
    .map((item) => item.name)
    .filter(
      (name) =>
        isCategoryEnabled(kind, name, overrides) ||
        (spentByName.get(name) ?? 0) > 0,
    )

export const categoryHint = (overrides: CategoryOverrides) => {
  const names = categoriesForSelect('expense', overrides).slice(0, 3)
  return `${names.join(' · ')}처럼 나눠요`
}

export const withCategoryOverride = (
  overrides: CategoryOverrides,
  kind: CategoryKind,
  name: string,
  enabled: boolean,
): CategoryOverrides => {
  if (isLockedCategory(name)) return overrides
  const item = CATEGORY_CATALOG[kind].find((entry) => entry.name === name)
  if (!item) return overrides

  const next: CategoryOverrides = {
    expense: { ...overrides.expense },
    income: { ...overrides.income },
  }

  if (enabled === item.defaultEnabled) delete next[kind][name]
  else next[kind][name] = enabled

  return next
}
