import type { Settings, SoundType } from '@/types/models'

/** localStorage 键名（schema 版本即 v1） */
export const STORAGE_KEY = 'focus-habit-panel:v1'
/** 当前数据 schema 版本；loadState 遇到更高（未知）版本会备份并回退默认 */
export const SCHEMA_VERSION = 2
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
