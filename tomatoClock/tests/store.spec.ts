import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useAppStore } from '@/stores/useAppStore'

describe('app store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('addHabit 去空格并分配 id/color', () => {
    const store = useAppStore()
    store.addHabit('  跑步 ', '#fff')
    expect(store.habits).toHaveLength(1)
    expect(store.habits[0].name).toBe('跑步')
    expect(store.habits[0].id).toBeTruthy()
    expect(store.habits[0].color).toBe('#fff')
  })

  it('addHabit 忽略空名', () => {
    const store = useAppStore()
    store.addHabit('   ', '#fff')
    expect(store.habits).toHaveLength(0)
  })

  it('toggleHabitCheck 打卡/取消，removeHabit 同步清理打卡记录', () => {
    const store = useAppStore()
    store.addHabit('阅读', '#fff')
    const id = store.habits[0].id

    store.toggleHabitCheck(id)
    expect(store.habitChecks).toHaveProperty([today(), id])
    expect(store.habitChecks[today()][id]).toBe(true)

    store.removeHabit(id)
    expect(store.habits).toHaveLength(0)
    expect(store.habitChecks[today()][id]).toBeUndefined()
  })

  it('reorderHabits 交换顺序', () => {
    const store = useAppStore()
    store.addHabit('a', '#fff')
    store.addHabit('b', '#fff')
    store.addHabit('c', '#fff')
    store.reorderHabits(0, 2)
    expect(store.habits.map((h) => h.name)).toEqual(['b', 'c', 'a'])
  })

  it('addTask / removeTask / toggleBind', () => {
    const store = useAppStore()
    store.addTask('写代码')
    expect(store.tasks).toHaveLength(1)
    const id = store.tasks[0].id

    store.toggleBind(id)
    expect(store.activeTaskId).toBe(id)
    expect(store.activeTask?.name).toBe('写代码')

    store.removeTask(id)
    expect(store.tasks).toHaveLength(0)
    expect(store.activeTaskId).toBeNull()
  })

  it('addTask 支持预估番茄数，缺省为 0', () => {
    const store = useAppStore()
    store.addTask('文章', 4)
    expect(store.tasks[0].estimate).toBe(4)
    store.addTask('无预估')
    expect(store.tasks[1].estimate).toBe(0)
  })

  it('setTaskEstimate 修改预估并向下取整到 >=0', () => {
    const store = useAppStore()
    store.addTask('文章', 4)
    const id = store.tasks[0].id
    store.setTaskEstimate(id, 8)
    expect(store.tasks[0].estimate).toBe(8)
    store.setTaskEstimate(id, -3)
    expect(store.tasks[0].estimate).toBe(0)
  })

  it('recordFocus 返回 id、记录意图、推进节奏', () => {
    const store = useAppStore()
    const id = store.recordFocus(25, '写文档')
    expect(store.sessions).toHaveLength(1)
    expect(id).toBeTruthy()
    expect(store.sessions[0].id).toBe(id)
    expect(store.sessions[0].intention).toBe('写文档')
    expect(store.sessions[0].rating).toBe(0)
    expect(store.pomoCycle).toBe(1)
  })

  it('reflect 更新评分与备注，并夹紧到 0..5', () => {
    const store = useAppStore()
    const id = store.recordFocus(25, '写文档')
    store.reflect(id, 6, '很专注')
    expect(store.sessions[0].rating).toBe(5)
    expect(store.sessions[0].note).toBe('很专注')
    store.reflect(id, -2, '一般般')
    expect(store.sessions[0].rating).toBe(0)
    expect(store.sessions[0].note).toBe('一般般')
  })

  it('setHabitRemind 仅接受 HH:mm 格式，否则清空', () => {
    const store = useAppStore()
    store.addHabit('早起')
    const id = store.habits[0].id
    store.setHabitRemind(id, '08:30')
    expect(store.habits[0].remindAt).toBe('08:30')
    store.setHabitRemind(id, '错误的格式')
    expect(store.habits[0].remindAt).toBeNull()
  })

  it('recordFocus 记录会话、推进节奏、给绑定任务 +1 🍅', () => {
    const store = useAppStore()
    store.addTask('任务')
    store.toggleBind(store.tasks[0].id)
    store.recordFocus(25)

    expect(store.sessions).toHaveLength(1)
    expect(store.sessions[0].minutes).toBe(25)
    expect(store.pomoCycle).toBe(1)
    expect(store.tasks[0].pomo).toBe(1)
  })

  it('merge 按 id 去重、打卡取并集、计数取较大值', () => {
    const store = useAppStore()
    store.addHabit('本地习惯', '#fff')
    const localId = store.habits[0].id

    store.merge({
      habits: [
        { id: localId, name: '本地习惯', color: '#fff', createdAt: 1 }, // 重复，本地优先
        { id: 'remote1', name: '导入习惯', color: '#000', createdAt: 1 }
      ],
      sessions: [{ id: 's1', minutes: 30, ts: 1000 }],
      habitChecks: { '2026-08-27': { remote1: true } },
      tasks: [],
      pomoCycle: 5,
      activeTaskId: null,
      settings: null,
      present: { tasks: true, pomoCycle: true, activeTaskId: true }
    })

    expect(store.habits).toHaveLength(2)
    expect(store.sessions).toHaveLength(1)
    expect(store.pomoCycle).toBe(5) // 0 与 5 取较大值
  })

  it('recordFocus 完成专注时发放专注币（每 5 分钟 1 枚，最少 1）', () => {
    const store = useAppStore()
    expect(store.companion.coins).toBe(0)
    store.recordFocus(25)
    expect(store.companion.coins).toBe(5)
    store.recordFocus(2)
    expect(store.companion.coins).toBe(6) // 2 分钟不足 5，按最少 1 枚计
  })

  it('companion 初始拥有默认皮肤与庆祝，且默认选用', () => {
    const store = useAppStore()
    expect(store.companion.unlocked).toContain('plant-succulent')
    expect(store.companion.unlocked).toContain('confetti')
    expect(store.companion.activeCompanion).toBe('plant-succulent')
    expect(store.companion.activeCelebration).toBe('confetti')
  })

  it('unlockCosmetic 余额不足/已拥有/不存在均返回 false', () => {
    const store = useAppStore()
    expect(store.unlockCosmetic('plant-mint')).toBe(false) // 余额 0 < 30
    expect(store.unlockCosmetic('plant-succulent')).toBe(false) // 已拥有
    expect(store.unlockCosmetic('nope')).toBe(false) // 不存在
  })

  it('unlockCosmetic 成功则扣币、入列、并自动选用', () => {
    const store = useAppStore()
    store.companion.coins = 30
    expect(store.unlockCosmetic('plant-mint')).toBe(true)
    expect(store.companion.coins).toBe(0)
    expect(store.companion.unlocked).toContain('plant-mint')
    expect(store.companion.activeCompanion).toBe('plant-mint') // 解锁后自动选用
  })

  it('setActiveCompanion 仅当已解锁时生效', () => {
    const store = useAppStore()
    store.setActiveCompanion('plant-lavender') // 未解锁，应忽略
    expect(store.companion.activeCompanion).toBe('plant-succulent')
    store.companion.unlocked.push('plant-lavender')
    store.setActiveCompanion('plant-lavender')
    expect(store.companion.activeCompanion).toBe('plant-lavender')
  })

  it('setCompanionName / setCompanionMsg 夹紧长度', () => {
    const store = useAppStore()
    store.setCompanionName('')
    expect(store.companion.name).toBe('小绿')
    store.setCompanionName('a'.repeat(30))
    expect(store.companion.name.length).toBe(16)
    store.setCompanionMsg('complete', 'b'.repeat(80))
    expect(store.companion.completeMsg.length).toBe(60)
    store.setCompanionMsg('fail', '别放弃')
    expect(store.companion.failMsg).toBe('别放弃')
  })
})

function today(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
