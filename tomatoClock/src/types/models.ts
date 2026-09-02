// 领域模型：全项目唯一的数据契约来源，组件/store/工具都从这里引用类型

export type HabitFreq = 'daily' | 'weekly' | 'monthly' | 'custom'

export interface Habit {
  id: string
  name: string
  color: string
  createdAt: number
  /** 打卡频率：每日 / 每周 / 每月 / 自定义星期 */
  freq?: HabitFreq
  /** weekly/custom：0-6 星期位（0=周日）；monthly：1-31 日期 */
  freqDays?: number[]
  /** 提醒时间 HH:mm，null=不提醒 */
  remindAt?: string | null
}

/** { 'YYYY-MM-DD': { habitId: true } } */
export type HabitChecks = Record<string, Record<string, true>>

export interface Session {
  id: string
  minutes: number
  ts: number
  /** 专注意图（开始前填写） */
  intention?: string
  /** 专注质量评分 1-5，0=未评 */
  rating?: number
  /** 复盘备注 */
  note?: string
}

export interface Task {
  id: string
  name: string
  done: boolean
  pomo: number
  /** 预估番茄数，0=未预估 */
  estimate?: number
}

export type Theme = 'light' | 'dark'
export type SoundType = 'chime' | 'bell' | 'wood' | 'beep' | string // string 允许自定义提示音 id
export type TimerMode = 'focus' | 'break' | 'long'

/** 用户自定义提示音（上传或录音），base64 存储在 localStorage */
export interface CustomSound {
  id: string
  name: string
  /** base64 data URL，如 data:audio/webm;base64,... */
  data: string
  /** 创建时间戳 */
  createdAt: number
}

/** 陪伴角色的即时情绪（仅运行时，不持久化） */
export type CompanionMood = 'idle' | 'focusing' | 'happy' | 'sad'

/** 陪伴角色（专注小园：随专注生长的数字植物）状态，持久化到 localStorage */
export interface CompanionState {
  /** 小园昵称 */
  name: string
  /** 专注露珠余额，由完成专注累积、解锁装饰消耗 */
  coins: number
  /** 已解锁的装饰 id（植物形态 + 庆祝特效共用此列表） */
  unlocked: string[]
  /** 当前选用的植物形态 id（必须在 unlocked 内） */
  activeCompanion: string
  /** 当前选用的庆祝特效 id（必须在 unlocked 内） */
  activeCelebration: string
  /** 自定义完成寄语，空串=使用默认 */
  completeMsg: string
  /** 自定义失败寄语，空串=使用默认 */
  failMsg: string
}

export interface Settings {
  focusMin: number
  breakMin: number
  longBreakMin: number
  /** 每完成 N 个番茄后进入长休息 */
  longBreakInterval: number
  /** 一段结束后是否自动开始下一段 */
  autoStart: boolean
  notify: boolean
  sound: boolean
  soundType: SoundType
  dailyFocusTarget: number
  dailyPomoTarget: number
  theme: Theme
  /** 用户自定义提示音列表 */
  customSounds: CustomSound[]
}

/** 持久化到 localStorage 的完整应用状态 */
export interface AppState {
  /** 数据 schema 版本，用于迁移；老备份可能缺失 */
  version?: number
  habits: Habit[]
  habitChecks: HabitChecks
  sessions: Session[]
  /** 已完成专注数（用于长休息节奏） */
  pomoCycle: number
  tasks: Task[]
  /** 当前绑定到番茄钟的任务 id */
  activeTaskId: string | null
  settings: Settings
  /** 陪伴角色（数字宠物）状态 */
  companion: CompanionState
}
