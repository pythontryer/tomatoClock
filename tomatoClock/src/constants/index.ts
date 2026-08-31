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

// ---------- 陪伴角色（专注小园：随专注生长的数字植物）----------

export const DEFAULT_COMPANION_NAME = '小绿'

/** 植物形态：决定植株主色；id 同时作为解锁项写入 companion.unlocked */
export interface PlantForm {
  id: string
  name: string
  cost: number
  /** 植株主色（叶/花） */
  body: string
  desc: string
}

export const PLANT_FORMS: PlantForm[] = [
  { id: 'plant-succulent', name: '多肉', cost: 0, body: '#7bbf6a', desc: '默认小苗' },
  { id: 'plant-mint', name: '薄荷', cost: 30, body: '#8fcf6b', desc: '清新的绿' },
  { id: 'plant-lavender', name: '薰衣草', cost: 40, body: '#9b8cda', desc: '安静的紫' },
  { id: 'plant-sunflower', name: '向日葵', cost: 60, body: '#f4c542', desc: '明亮的黄' }
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

/** 完成专注时随机送出的小礼物（惊喜感来源，植物主题） */
export const FOCUS_GIFTS = ['🌿', '🍃', '🌸', '🌻', '💧', '🌱', '🍀', '🌼']

/** 完成一个专注番茄获得的专注露珠：每 5 分钟 1 滴，最少 1 滴 */
export function focusCoins(minutes: number): number {
  const m = Number(minutes)
  if (!Number.isFinite(m) || m <= 0) return 0
  return Math.max(1, Math.round(m / 5))
}

/** 由植物形态 id 取到完整定义，找不到回退到默认多肉 */
export function getForm(id: string): PlantForm {
  return PLANT_FORMS.find((s) => s.id === id) ?? PLANT_FORMS[0]
}

export function getCelebration(id: string): Celebration {
  return CELEBRATIONS.find((c) => c.id === id) ?? CELEBRATIONS[0]
}

/** 在列表中按 id 找到装饰（植物形态或庆祝皆可），找不到返回 undefined */
export function findCosmetic(id: string): PlantForm | Celebration | undefined {
  return (
    PLANT_FORMS.find((s) => s.id === id) ?? CELEBRATIONS.find((c) => c.id === id)
  )
}

/**
 * 由已完成专注数推导植物成长阶段 0-3：每完成 4 次进阶，第 12 次绽放。
 * 用于让专注小园随专注记录“长高、长叶、开花”，把抽象积累变成可见的生长。
 */
export function plantStage(pomoCycle: number): number {
  const n = Number(pomoCycle)
  if (!Number.isFinite(n) || n < 0) return 0
  return Math.min(3, Math.floor(n / 4))
}
