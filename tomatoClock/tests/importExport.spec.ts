import { describe, it, expect } from 'vitest'
import { sanitize } from '@/utils/importExport'

describe('sanitize', () => {
  it('合法数据：归一化并保留内部字段', () => {
    const good = {
      habits: [{ id: 'h1', name: ' 读书 ', color: '#abc', createdAt: 100 }],
      sessions: [{ id: 's1', minutes: 25, ts: 1700000000000 }],
      habitChecks: { '2026-01-01': { h1: true } },
      tasks: [{ id: 't1', name: '写报告', done: true, pomo: 3 }],
      pomoCycle: 7,
      activeTaskId: 't1',
      settings: { theme: 'dark' }
    }
    const res = sanitize(good)
    expect(res.error).toBeUndefined()
    expect(res.data).toBeDefined()
    // 名称被 trim
    expect(res.data!.habits[0].name).toBe('读书')
    // 缺省字段补齐
    expect(res.data!.habits[0].freq).toBe('daily')
    expect(res.data!.habits[0].freqDays).toEqual([])
    expect(res.data!.habits[0].remindAt).toBeNull()
    expect(res.data!.sessions[0].rating).toBe(0)
    expect(res.data!.tasks[0].estimate).toBe(0)
    expect(res.data!.present).toEqual({ tasks: true, pomoCycle: true, activeTaskId: true })
    expect(res.skipped).toEqual({ habits: 0, sessions: 0, tasks: 0 })
  })

  it('根节点非对象应报错', () => {
    expect(sanitize('not json' as unknown).error).toBeTruthy()
    expect(sanitize([1, 2] as unknown).error).toBeTruthy()
    expect(sanitize(null).error).toBeTruthy()
  })

  it('缺失 habits / sessions / habitChecks 应报错', () => {
    expect(sanitize({ sessions: [] }).error).toBeTruthy()
    expect(sanitize({ habits: [] }).error).toBeTruthy()
    expect(sanitize({ habits: [], sessions: [] }).error).toBeTruthy()
  })

  it('坏习惯条目被跳过并计数（不整文件失败）', () => {
    const res = sanitize({
      habits: [
        { id: 'h1', name: '好' },
        { name: '缺 id' },
        { id: 'h3', name: '  ' },
        { id: 'h4', name: '好2' }
      ],
      sessions: [],
      habitChecks: {}
    })
    expect(res.data!.habits).toHaveLength(2)
    expect(res.skipped.habits).toBe(2)
  })

  it('坏专注条目（分钟越界 / ts 非法）被跳过', () => {
    const res = sanitize({
      habits: [{ id: 'h1', name: 'x' }],
      sessions: [
        { id: 's1', minutes: 25, ts: 1700000000000 },
        { id: 's2', minutes: 0, ts: 1700000000000 },
        { id: 's3', minutes: 2000, ts: 1700000000000 },
        { id: 's4', minutes: 25, ts: 0 },
        { id: 's5', minutes: 25, ts: -5 }
      ],
      habitChecks: {}
    })
    expect(res.data!.sessions).toHaveLength(1)
    expect(res.skipped.sessions).toBe(4)
  })

  it('老备份无 tasks：present.tasks=false 且 tasks 为空', () => {
    const res = sanitize({
      habits: [{ id: 'h1', name: 'x' }],
      sessions: [{ id: 's1', minutes: 25, ts: 1700000000000 }],
      habitChecks: {}
    })
    expect(res.data!.present.tasks).toBe(false)
    expect(res.data!.tasks).toEqual([])
  })

  it('habitChecks 中非法值被忽略', () => {
    const res = sanitize({
      habits: [{ id: 'h1', name: 'x' }],
      sessions: [],
      habitChecks: { '2026-01-01': { h1: true }, 'bad': 'notobject' as unknown }
    })
    expect(res.data!.habitChecks['2026-01-01']).toEqual({ h1: true })
    expect(res.data!.habitChecks['bad']).toBeUndefined()
  })
})
