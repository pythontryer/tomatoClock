import type { Settings, SoundType } from '@/types/models'

/** localStorage 键名（schema 版本即 v1） */
export const STORAGE_KEY = 'focus-habit-panel:v1'
/** 当前数据 schema 版本；loadState 遇到更高（未知）版本会备份并回退默认 */
export const SCHEMA_VERSION = 3
/** 损坏/不兼容数据备份键，避免直接丢弃造成数据丢失 */
export const CORRUPT_BACKUP_KEY = 'focus-habit-panel:corrupt-backup'

export const DEFAULT_SETTINGS: Settings = {
  focusMin: 25,
  breakMin: 5,
  longBreakMin: 15,
  longBreakInterval: 4,
  autoStart: false,
  notify: true,
  sound: true,
  soundType: 'chime',
  dailyFocusTarget: 120,
  dailyPomoTarget: 8,
  theme: 'light'
}

export const HABIT_COLORS = [
  '#5b6cff',
  '#2bbf8a',
  '#ffae42',
  '#ff6b6b',
  '#9b6bff',
  '#1fb6d6'
] as const

export interface SoundNote {
  freq: number
  offset: number
  duration: number
}

export interface SoundProfile {
  type: OscillatorType
  peak: number
  notes: SoundNote[]
}

/** 提示音 profile：全部用 WebAudio 振荡器实时合成，无需音频文件 */
export const SOUND_PROFILES: Record<SoundType, SoundProfile> = {
  chime: {
    type: 'sine',
    peak: 0.3,
    notes: [
      { freq: 880, offset: 0, duration: 0.4 },
      { freq: 1174.7, offset: 0.18, duration: 0.4 }
    ]
  },
  bell: {
    type: 'sine',
    peak: 0.26,
    notes: [
      { freq: 659.25, offset: 0, duration: 1.3 },
      { freq: 1318.5, offset: 0, duration: 1.1 },
      { freq: 1978, offset: 0, duration: 0.9 }
    ]
  },
  wood: {
    type: 'triangle',
    peak: 0.4,
    notes: [
      { freq: 520, offset: 0, duration: 0.18 },
      { freq: 420, offset: 0.16, duration: 0.18 }
    ]
  },
  beep: {
    type: 'square',
    peak: 0.16,
    notes: [
      { freq: 1000, offset: 0, duration: 0.12 },
      { freq: 1000, offset: 0.22, duration: 0.12 }
    ]
  }
}

export const SOUND_OPTIONS: { value: SoundType; label: string }[] = [
  { value: 'chime', label: '柔和双音' },
  { value: 'bell', label: '钟声' },
  { value: 'wood', label: '木鱼' },
  { value: 'beep', label: '电子 beep' }
]

// ---------- 陪伴角色（数字宠物）----------

export const DEFAULT_COMPANION_NAME = '小猫'

/** 陪伴皮肤：决定猫身主色；id 同时作为解锁项写入 companion.unlocked */
export interface CompanionSkin {
  id: string
  name: string
  cost: number
  /** 猫身主色 */
  body: string
  desc: string
}

export const COMPANION_SKINS: CompanionSkin[] = [
  { id: 'cat-cream', name: '奶油猫', cost: 0, body: '#e7d8c4', desc: '默认小伙伴' },
  { id: 'cat-orange', name: '橘猫', cost: 30, body: '#f0a868', desc: '暖暖的橘色' },
  { id: 'cat-gray', name: '灰猫', cost: 30, body: '#9aa3ad', desc: '安静的灰' },
  { id: 'cat-tuxedo', name: '燕尾猫', cost: 60, body: '#4a4a52', desc: '黑白绅士' }
]

/** 庆祝特效：完成专注时的小动效字符 */
export interface Celebration {
  id: string
  name: string
  cost: number
  /** 动效使用的字符 */
  particle: string
  desc: string
}

export const CELEBRATIONS: Celebration[] = [
  { id: 'confetti', name: '彩屑', cost: 0, particle: '🎉', desc: '默认庆祝' },
  { id: 'stars', name: '星星', cost: 25, particle: '⭐', desc: '完成时飘星星' },
  { id: 'hearts', name: '爱心', cost: 40, particle: '💗', desc: '完成时飘爱心' }
]

/** 完成专注时随机送出的小礼物（惊喜感来源） */
export const FOCUS_GIFTS = ['🐟', '🥫', '🧶', '🍤', '🌿', '🍰', '🦴', '🧦']

/** 完成一个专注番茄获得的专注币：每 5 分钟 1 枚，最少 1 枚 */
export function focusCoins(minutes: number): number {
  const m = Number(minutes)
  if (!Number.isFinite(m) || m <= 0) return 0
  return Math.max(1, Math.round(m / 5))
}

export function getSkin(id: string): CompanionSkin {
  return COMPANION_SKINS.find((s) => s.id === id) ?? COMPANION_SKINS[0]
}

export function getCelebration(id: string): Celebration {
  return CELEBRATIONS.find((c) => c.id === id) ?? CELEBRATIONS[0]
}

/** 在列表中按 id 找到装饰（陪伴或庆祝皆可），找不到返回 undefined */
export function findCosmetic(id: string): CompanionSkin | Celebration | undefined {
  return (
    COMPANION_SKINS.find((s) => s.id === id) ?? CELEBRATIONS.find((c) => c.id === id)
  )
}
