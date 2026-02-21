export const GHOST_IMAGES = [
  { id: 'ghost_1', src: '/imgs/ghost_1.png', label: '유령1' },
  { id: 'ghost_2', src: '/imgs/ghost_2.png', label: '유령2' },
  { id: 'ghost_3', src: '/imgs/ghost_3.png', label: '유령3' },
  { id: 'ghost_4', src: '/imgs/ghost_4.png', label: '유령4' },
  { id: 'ghost_5', src: '/imgs/ghost_5.png', label: '유령5' },
] as const

export type GhostId = (typeof GHOST_IMAGES)[number]['id']
