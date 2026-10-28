export const CATEGORY_ICON_SRC: Record<string, string> = {
  식비: '/imgs/categories/category-food.png?v=3',
  교통: '/imgs/categories/category-transit.png?v=2',
  생활: '/imgs/categories/category-living.png?v=3',
  의료: '/imgs/categories/category-medical.png?v=2',
  쇼핑: '/imgs/categories/category-shopping.png?v=3',
  카페: '/imgs/categories/category-cafe.png?v=3',
  오락: '/imgs/categories/category-fun.png?v=2',
  월급: '/imgs/categories/category-salary.png?v=2',
  부수입: '/imgs/categories/category-side-income.png?v=2',
  용돈: '/imgs/categories/category-allowance.png?v=2',
  금융수익: '/imgs/categories/category-finance.png?v=2',
  정산: '/imgs/categories/category-split.png?v=3',
  기타: '/imgs/categories/category-etc.png?v=2',
}

export const getCategoryIconSrc = (category: string) =>
  CATEGORY_ICON_SRC[category] ?? CATEGORY_ICON_SRC.기타
