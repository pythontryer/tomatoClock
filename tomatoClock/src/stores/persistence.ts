import { STORAGE_KEY, DEFAULT_SETTINGS, SCHEMA_VERSION, CORRUPT_BACKUP_KEY } from '@/constants'
import type { AppState } from '@/types/models'
import { normalizeHabit, normalizeTask, normalizeSession, normalizeCompanion } from '@/utils/normalize'

/**
 * 从 localStorage 读取原始数据。
 * - 解析失败（损坏串）：备份到 CORRUPT_BACKUP_KEY 后返回 null（走默认）。
 * - 来自更高/未知 schema 版本的备份（无法降级识别）：同样备份后返回 null。
 * - 老数据（无 version 字段）正常返回，交给 withDefaults 归一化迁移。
 */
export function loadState(): Partial<AppState> | null {
  let raw: string | null
  try {
    raw = localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null
    // 更高版本：当前代码无法识别其结构，备份后丢弃，避免误读造成数据错乱
    if (typeof parsed.version === 'number' && parsed.version > SCHEMA_VERSION) {
      try {
        localStorage.setItem(CORRUPT_BACKUP_KEY, raw)
      } catch {
        /* 备份失败不影响读默认 */
      }
      return null
    }
    return parsed as Partial<AppState>
  } catch {
    // JSON 解析失败：原串损坏，备份后回退默认
    try {
      localStorage.setItem(CORRUPT_BACKUP_KEY, raw)
    } catch {
      /* ignore */
    }
    return null
  }
}

export function saveState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, version: SCHEMA_VERSION }))
  } catch {
    /* 写入失败（如隐私模式）静默忽略 */
  }
}

/** 合并默认值 + 归一化嵌套数组，保证老数据也能补齐后续新增字段 */
export function withDefaults(base: Partial<AppState> | null): AppState {
  const b = base ?? {}
  return {
    version: SCHEMA_VERSION,
    habits: Array.isArray(b.habits) ? b.habits.map((h) => normalizeHabit(h)) : [],
    habitChecks:
      b.habitChecks && typeof b.habitChecks === 'object' && !Array.isArray(b.habitChecks)
        ? b.habitChecks
        : {},
    sessions: Array.isArray(b.sessions) ? b.sessions.map((s) => normalizeSession(s)) : [],
    pomoCycle: typeof b.pomoCycle === 'number' && b.pomoCycle >= 0 ? b.pomoCycle : 0,
    tasks: Array.isArray(b.tasks) ? b.tasks.map((t) => normalizeTask(t)) : [],
    activeTaskId:
      b.activeTaskId === null || typeof b.activeTaskId === 'string'
        ? (b.activeTaskId ?? null)
        : null,
    settings: { ...DEFAULT_SETTINGS, ...(b.settings ?? {}) },
    companion: normalizeCompanion(b.companion)
  }
}
