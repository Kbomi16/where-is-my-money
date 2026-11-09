export const CATEGORY_ICON_SRC: Record<string, string> = {
  식비: '/imgs/categories/category-food.png?v=3',
  교통: '/imgs/categories/category-transit.png?v=2',
  생활: '/imgs/categories/category-living.png?v=3',
  의료: '/imgs/categories/category-medical.png?v=2',
  쇼핑: '/imgs/categories/category-shopping.png?v=3',
  카페: '/imgs/categories/category-cafe.png?v=3',
  오락: '/imgs/categories/category-fun.png?v=2',
  주거: '/imgs/categories/category-housing.png?v=1',
  구독: '/imgs/categories/category-subscription.png?v=1',
  운동: '/imgs/categories/category-exercise.png?v=1',
  경조사: '/imgs/categories/category-ceremony.png?v=1',
  월급: '/imgs/categories/category-salary.png?v=2',
  부수입: '/imgs/categories/category-side-income.png?v=2',
  용돈: '/imgs/categories/category-allowance.png?v=2',
  금융수익: '/imgs/categories/category-finance.png?v=2',
  정산: '/imgs/categories/category-split.png?v=3',
  상여: '/imgs/categories/category-bonus.png?v=1',
  환급: '/imgs/categories/category-refund.png?v=1',
  기타: '/imgs/categories/category-etc.png?v=2',
}

export const getCategoryIconSrc = (category: string) =>
  CATEGORY_ICON_SRC[category] ?? CATEGORY_ICON_SRC.기타
