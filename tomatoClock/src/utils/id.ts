let seq = 0

/** 生成本地唯一 id：时间戳 + 自增序号（36 进制），用于习惯/任务/专注会话 */
export function uid(): string {
  return Date.now().toString(36) + (seq++).toString(36)
}
