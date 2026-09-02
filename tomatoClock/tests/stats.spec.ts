import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia, type Pinia } from 'pinia'
import { useAppStore } from '@/stores/useAppStore'
import { todayKey, lastNDays } from '@/utils/date'
import KpiCards from '@/components/stats/KpiCards.vue'
import TaskDistribution from '@/components/stats/TaskDistribution.vue'
import HabitRateChart from '@/components/stats/HabitRateChart.vue'
import TaskEstimateVariance from '@/components/stats/TaskEstimateVariance.vue'
import TrendChart from '@/components/stats/TrendChart.vue'
import type { Habit, Session, Task } from '@/types/models'

let pinia: Pinia

beforeEach(() => {
  pinia = createPinia()
  setActivePinia(pinia)
  localStorage.clear()
})

function sessionToday(minutes: number): Session {
  return { id: 's' + Math.random(), minutes, ts: Date.now(), rating: 0, note: '' }
}

function sessionPast(minutes: number, daysAgo: number): Session {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  return { id: 'p' + Math.random(), minutes, ts: d.getTime(), rating: 0, note: '' }
}

function habit(name: string, freq: Habit['freq'] = 'daily'): Habit {
  return {
    id: 'h' + Math.random(),
    name,
    color: '#fff',
    createdAt: Date.now(),
    freq
  }
}

function task(name: string, pomo: number, estimate = 0): Task {
  return { id: 't' + Math.random(), name, done: false, pomo, estimate }
}

describe('KpiCards', () => {
  it('空数据时三项均为 0', () => {
    const wrapper = mount(KpiCards, { global: { plugins: [pinia] } })
    const nums = wrapper.findAll('.k-num').map((n) => n.text())
    expect(nums).toEqual(['0分', '0个', '0%'])
  })

  it('仅统计今日 sessions：专注分钟与番茄数', () => {
    const store = useAppStore()
    store.sessions.push(sessionToday(25), sessionToday(50), sessionPast(30, 1))
    const wrapper = mount(KpiCards, { global: { plugins: [pinia] } })
    const nums = wrapper.findAll('.k-num').map((n) => n.text())
    expect(nums[0]).toBe('75分')
    expect(nums[1]).toBe('2个')
  })

  it('习惯完成率：今日应打卡习惯中已打卡比例', () => {
    const store = useAppStore()
    const h1 = habit('跑步')
    const h2 = habit('阅读')
    store.habits.push(h1, h2)
    const today = todayKey()
    store.habitChecks[today] = { [h1.id]: true }
    const wrapper = mount(KpiCards, { global: { plugins: [pinia] } })
    const nums = wrapper.findAll('.k-num').map((n) => n.text())
    // 两个 daily 习惯，h1 已打卡、h2 未打卡 → 50%
    expect(nums[2]).toBe('50%')
  })

  it('无应打卡习惯时完成率为 0%', () => {
    const store = useAppStore()
    // 构造一个今天肯定不 due 的 weekly 习惯（设为明天的星期）
    const tomorrow = (new Date().getDay() + 1) % 7
    const h = habit('周更', 'weekly')
    h.freqDays = [tomorrow]
    store.habits.push(h)
    const wrapper = mount(KpiCards, { global: { plugins: [pinia] } })
    const nums = wrapper.findAll('.k-num').map((n) => n.text())
    expect(nums[2]).toBe('0%')
  })
})

describe('TaskDistribution', () => {
  it('无任务或无番茄时显示空状态', () => {
    const wrapper = mount(TaskDistribution, { global: { plugins: [pinia] } })
    expect(wrapper.find('.td-empty').exists()).toBe(true)
    expect(wrapper.find('.td-row').exists()).toBe(false)
  })

  it('过滤 pomo=0 的任务，按番茄数降序排列', () => {
    const store = useAppStore()
    store.tasks.push(
      task('写文档', 2),
      task('零番茄', 0),
      task('写代码', 5),
      task('开会', 1)
    )
    const wrapper = mount(TaskDistribution, { global: { plugins: [pinia] } })
    const rows = wrapper.findAll('.td-row')
    expect(rows).toHaveLength(3)
    const names = rows.map((r) => r.find('.td-name').text())
    expect(names).toEqual(['写代码', '写文档', '开会'])
    const vals = rows.map((r) => r.find('.td-val').text())
    expect(vals).toEqual(['🍅 5', '🍅 2', '🍅 1'])
  })

  it('显示番茄总数', () => {
    const store = useAppStore()
    store.tasks.push(task('A', 3), task('B', 4))
    const wrapper = mount(TaskDistribution, { global: { plugins: [pinia] } })
    expect(wrapper.find('.chart-title').text()).toContain('共 🍅 7')
  })

  it('进度条宽度按最大值归一化', () => {
    const store = useAppStore()
    store.tasks.push(task('大任务', 10), task('小任务', 5))
    const wrapper = mount(TaskDistribution, { global: { plugins: [pinia] } })
    const fills = wrapper.findAll('.td-fill')
    expect(fills).toHaveLength(2)
    expect(fills[0].attributes('style')).toContain('width: 100%')
    expect(fills[1].attributes('style')).toContain('width: 50%')
  })
})

describe('HabitRateChart', () => {
  it('无习惯时 7 天均显示空值', () => {
    const wrapper = mount(HabitRateChart, { global: { plugins: [pinia] } })
    const cols = wrapper.findAll('.bar-col')
    expect(cols).toHaveLength(7)
    cols.forEach((c) => {
      expect(c.find('.bar-val').text()).toBe('')
    })
  })

  it('daily 习惯近 7 天完成率正确计算', () => {
    const store = useAppStore()
    const h = habit('跑步')
    store.habits.push(h)
    const days = lastNDays(7)
    // 前 3 天打卡，后 4 天不打卡
    days.slice(0, 3).forEach((day) => {
      if (!store.habitChecks[day]) store.habitChecks[day] = {}
      store.habitChecks[day][h.id] = true
    })
    const wrapper = mount(HabitRateChart, { global: { plugins: [pinia] } })
    const vals = wrapper.findAll('.bar-val').map((v) => v.text())
    // lastNDays 从今天往前排，索引 0 是今天
    // 我们给前3天（索引0-2）打卡，所以前3个是100%，后4个是0%
    expect(vals.slice(0, 3)).toEqual(['100%', '100%', '100%'])
    expect(vals.slice(3)).toEqual(['0%', '0%', '0%', '0%'])
  })

  it('无应打卡习惯的日期 rate 为 null（显示空）', () => {
    const store = useAppStore()
    // weekly 习惯只在每周一打卡（getDay()=1）
    const h = habit('周更', 'weekly')
    h.freqDays = [1]
    store.habits.push(h)
    const wrapper = mount(HabitRateChart, { global: { plugins: [pinia] } })
    const cols = wrapper.findAll('.bar-col')
    expect(cols).toHaveLength(7)
    // 至少有一天是非周一，rate 为 null 显示空
    const emptyCount = cols.filter((c) => c.find('.bar-val').text() === '').length
    expect(emptyCount).toBeGreaterThan(0)
  })

  it('柱状图高度对应完成率', () => {
    const store = useAppStore()
    const h = habit('阅读')
    store.habits.push(h)
    const days = lastNDays(7)
    // 今天 50%（2个习惯中1个打卡）
    const h2 = habit('写作')
    store.habits.push(h2)
    store.habitChecks[days[0]] = { [h.id]: true }
    const wrapper = mount(HabitRateChart, { global: { plugins: [pinia] } })
    const fills = wrapper.findAll('.bar-fill')
    // 今天（第一列）应该是 50%
    expect(fills[0].attributes('style')).toContain('height: 50%')
  })
})

describe('TaskEstimateVariance', () => {
  it('无预估任务时不渲染', () => {
    const store = useAppStore()
    store.tasks.push(task('无预估', 2, 0))
    const wrapper = mount(TaskEstimateVariance, { global: { plugins: [pinia] } })
    expect(wrapper.find('.variance').exists()).toBe(false)
  })

  it('过滤 estimate=0 的任务，仅显示有预估的', () => {
    const store = useAppStore()
    store.tasks.push(task('无预估', 3, 0), task('有预估', 2, 4))
    const wrapper = mount(TaskEstimateVariance, { global: { plugins: [pinia] } })
    expect(wrapper.findAll('.row')).toHaveLength(1)
    expect(wrapper.find('.rname').text()).toBe('有预估')
  })

  it('超标任务排在前面', () => {
    const store = useAppStore()
    store.tasks.push(task('达标', 3, 4), task('超标', 6, 4))
    const wrapper = mount(TaskEstimateVariance, { global: { plugins: [pinia] } })
    const names = wrapper.findAll('.rname').map((n) => n.text())
    expect(names).toEqual(['超标', '达标'])
  })

  it('进度条宽度按 min(1, actual/est) 计算，超标封顶100%', () => {
    const store = useAppStore()
    store.tasks.push(task('半完成', 2, 4), task('超标', 8, 4))
    const wrapper = mount(TaskEstimateVariance, { global: { plugins: [pinia] } })
    const fills = wrapper.findAll('.fill')
    // 超标排第一：8/4=2 → 封顶 100%
    expect(fills[0].attributes('style')).toContain('width: 100%')
    // 半完成：2/4=0.5 → 50%
    expect(fills[1].attributes('style')).toContain('width: 50%')
  })

  it('达标/超标样式类正确', () => {
    const store = useAppStore()
    store.tasks.push(task('超标', 5, 4), task('达标', 4, 4), task('未达标', 2, 4))
    const wrapper = mount(TaskEstimateVariance, { global: { plugins: [pinia] } })
    const fills = wrapper.findAll('.fill')
    expect(fills[0].classes()).toContain('over')
    expect(fills[1].classes()).toContain('done')
    expect(fills[2].classes()).not.toContain('done')
    expect(fills[2].classes()).not.toContain('over')
  })

  it('汇总统计正确', () => {
    const store = useAppStore()
    store.tasks.push(task('A', 3, 4), task('B', 5, 4))
    const wrapper = mount(TaskEstimateVariance, { global: { plugins: [pinia] } })
    expect(wrapper.find('.title').text()).toContain('共 2 项')
    expect(wrapper.find('.title').text()).toContain('已达标 1 项')
    expect(wrapper.find('.footer').text()).toContain('实际 8 / 预估 8')
  })
})

describe('TrendChart', () => {
  it('默认周视图（7天），时长指标', () => {
    const wrapper = mount(TrendChart, { global: { plugins: [pinia] } })
    expect(wrapper.find('.chart-title').text()).toContain('近 7 天专注时长')
    expect(wrapper.findAll('.track')).toHaveLength(7)
  })

  it('每日专注时长正确聚合', () => {
    const store = useAppStore()
    store.sessions.push(sessionToday(25), sessionToday(50), sessionPast(30, 1))
    const wrapper = mount(TrendChart, { global: { plugins: [pinia] } })
    const tracks = wrapper.findAll('.track')
    // lastNDays 从远到近，今天是最后一个（索引6），昨天是索引5
    const todayTitle = tracks[6].attributes('title') || ''
    expect(todayTitle).toContain('75')
    const yesterdayTitle = tracks[5].attributes('title') || ''
    expect(yesterdayTitle).toContain('30')
  })

  it('切换到个数指标显示番茄数', async () => {
    const store = useAppStore()
    store.sessions.push(sessionToday(25), sessionToday(50))
    const wrapper = mount(TrendChart, { global: { plugins: [pinia] } })
    const buttons = wrapper.findAll('.seg button')
    // 第二个 seg 组的第二个按钮是"个数"
    await buttons[3].trigger('click')
    expect(wrapper.find('.chart-title').text()).toContain('近 7 天完成番茄数')
    const todayTitle = wrapper.findAll('.track')[6].attributes('title') || ''
    expect(todayTitle).toContain('2')
  })

  it('切换到月视图显示30天', async () => {
    const wrapper = mount(TrendChart, { global: { plugins: [pinia] } })
    const buttons = wrapper.findAll('.seg button')
    // 第一个 seg 组的第二个按钮是"月"
    await buttons[1].trigger('click')
    expect(wrapper.find('.chart-title').text()).toContain('近 30 天')
    expect(wrapper.findAll('.track')).toHaveLength(30)
  })

  it('汇总统计：合计、日均、达标天数', () => {
    const store = useAppStore()
    store.settings.dailyFocusTarget = 60
    // 今天 75 分钟（达标），昨天 30 分钟（不达标），其余 0
    store.sessions.push(sessionToday(75), sessionPast(30, 1))
    const wrapper = mount(TrendChart, { global: { plugins: [pinia] } })
    const summary = wrapper.find('.summary').text()
    expect(summary).toContain('合计 105')
    expect(summary).toContain('日均 15')
    expect(summary).toContain('达标 1/7 天')
  })

  it('目标线在目标>0时显示', () => {
    const store = useAppStore()
    store.settings.dailyFocusTarget = 120
    const wrapper = mount(TrendChart, { global: { plugins: [pinia] } })
    expect(wrapper.find('.target-line').exists()).toBe(true)
    expect(wrapper.find('.target-label').text()).toContain('目标 120分')
  })
})
