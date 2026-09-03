import type { CompanionState, EvolutionState, Habit, HabitFreq, Session, Task } from '@/types/models'
import { DEFAULT_COMPANION_NAME } from '@/constants'
import { DEFAULT_FORM, getWantedItem, EVOLUTION_FORMS } from '@/constants/evolution'

/**
 * 归一化工具：把「可能有缺失字段」的对象补齐为完整、合法的领域模型。
 * 供 persistence.withDefaults（加载/迁移老数据）与 importExport.sanitize（导入清洗）共用，
 * 避免各处的默认值逻辑发散。所有函数对非法输入只补默认、不抛错。
 */

const HABIT_FREQS: HabitFreq[] = ['daily', 'weekly', 'monthly', 'custom']

export function normalizeHabit(h: Partial<Habit> & { id: string; name: string }): Habit {
  const freq: HabitFreq = HABIT_FREQS.includes(h.freq as HabitFreq)
    ? (h.freq as HabitFreq)
    : 'daily'
  const freqDays = Array.isArray(h.freqDays)
    ? h.freqDays.filter((n) => Number.isInteger(n) && n >= 0 && n <= 31)
    : []
  return {
    id: h.id,
    name: h.name.trim(),
    color: typeof h.color === 'string' && h.color ? h.color : '#5b6cff',
    createdAt:
      typeof h.createdAt === 'number' && Number.isFinite(h.createdAt) ? h.createdAt : Date.now(),
    freq,
    freqDays,
    remindAt: typeof h.remindAt === 'string' ? h.remindAt : null
  }
}

export function normalizeTask(t: Partial<Task> & { id: string; name: string }): Task {
  return {
    id: t.id,
    name: t.name.trim(),
    done: t.done === true,
    pomo: typeof t.pomo === 'number' && t.pomo >= 0 ? t.pomo : 0,
    estimate: typeof t.estimate === 'number' && t.estimate >= 0 ? t.estimate : 0
  }
}

export function normalizeSession(
  s: Partial<Session> & { id: string; minutes: number; ts: number }
): Session {
  return {
    id: s.id,
    minutes: s.minutes,
    ts: s.ts,
    intention: typeof s.intention === 'string' ? s.intention : '',
    rating: typeof s.rating === 'number' && s.rating >= 1 && s.rating <= 5 ? s.rating : 0,
    note: typeof s.note === 'string' ? s.note : ''
  }
}

export function defaultCompanion(): CompanionState {
  return {
    name: DEFAULT_COMPANION_NAME,
    coins: 0,
    unlocked: ['plant-succulent', 'confetti'],
    activeCompanion: 'plant-succulent',
    activeCelebration: 'confetti',
    completeMsg: '',
    failMsg: ''
  }
}

export function defaultEvolution(): EvolutionState {
  const wanted = getWantedItem(DEFAULT_FORM)
  return {
    formId: DEFAULT_FORM.id,
    name: DEFAULT_FORM.name,
    decoration: '',
    inventory: {},
    wantedItemId: wanted.id,
    history: [],
    discoveredForms: [DEFAULT_FORM.id]
  }
}

export function normalizeEvolution(e: Partial<EvolutionState> | null | undefined): EvolutionState {
  const d = defaultEvolution()
  if (!e || typeof e !== 'object') return d
  const formId =
    typeof e.formId === 'string' && EVOLUTION_FORMS.some((f) => f.id === e.formId)
      ? e.formId
      : d.formId
  const inventory =
    e.inventory && typeof e.inventory === 'object' && !Array.isArray(e.inventory)
      ? e.inventory
      : {}
  const discoveredForms = Array.isArray(e.discoveredForms)
    ? Array.from(new Set([...d.discoveredForms, ...e.discoveredForms.filter((x) => typeof x === 'string')]))
    : d.discoveredForms
  return {
    formId,
    name: typeof e.name === 'string' && e.name.trim() ? e.name.trim().slice(0, 16) : d.name,
    decoration: typeof e.decoration === 'string' ? e.decoration : '',
    inventory,
    wantedItemId: typeof e.wantedItemId === 'string' ? e.wantedItemId : d.wantedItemId,
    history: Array.isArray(e.history) ? e.history.slice(-50) : [],
    discoveredForms
  }
}

/**
 * 归一化陪伴角色状态。只补默认、不抛错；已解锁列表与当前选用项都会回退到合法默认值，
 * 避免导入/老备份里指向已不存在的装饰 id 导致界面取不到数据。
 */
export function normalizeCompanion(c: Partial<CompanionState> | null | undefined): CompanionState {
  const d = defaultCompanion()
  if (!c || typeof c !== 'object') return d
  const unlocked = Array.isArray(c.unlocked)
    ? Array.from(
        new Set([
          ...d.unlocked,
          ...c.unlocked.filter((x): x is string => typeof x === 'string' && !!x)
        ])
      )
    : d.unlocked
  const activeCompanion =
    typeof c.activeCompanion === 'string' && unlocked.includes(c.activeCompanion)
      ? c.activeCompanion
      : d.activeCompanion
  const activeCelebration =
    typeof c.activeCelebration === 'string' && unlocked.includes(c.activeCelebration)
      ? c.activeCelebration
      : d.activeCelebration
  return {
    name: typeof c.name === 'string' && c.name.trim() ? c.name.trim().slice(0, 16) : d.name,
    coins: typeof c.coins === 'number' && c.coins >= 0 ? Math.floor(c.coins) : 0,
    unlocked,
    activeCompanion,
    activeCelebration,
    completeMsg: typeof c.completeMsg === 'string' ? c.completeMsg.slice(0, 60) : '',
    failMsg: typeof c.failMsg === 'string' ? c.failMsg.slice(0, 60) : ''
  }
}
