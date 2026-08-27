<script setup>
import { ref, computed } from "vue"
import { useStore } from "../store/useStore"
import { todayKey, lastNDays, weekdayLabel } from "../utils/date"

const { state, uid } = useStore()

const today = todayKey()

// ---------- 趋势图状态 ----------
const range = ref(7) // 7=周视图, 30=月视图
const metric = ref("focus") // 'focus'=专注时长, 'pomo'=番茄数

const unit = computed(() => (metric.value === "focus" ? "分" : "个"))
const chartTitle = computed(() =>
  metric.value === "focus" ? `近 ${range.value} 天专注时长` : `近 ${range.value} 天完成番茄数`
)

const days = computed(() => lastNDays(range.value))

const target = computed(() =>
  metric.value === "focus"
    ? state.settings.dailyFocusTarget
    : state.settings.dailyPomoTarget
)

// 每日数值序列
const series = computed(() => {
  const byDay = new Map()
  for (const s of state.sessions) {
    const key = todayKey(new Date(s.ts))
    const v = metric.value === "focus" ? s.minutes : 1
    byDay.set(key, (byDay.get(key) || 0) + v)
  }
  return days.value.map((day) => ({ day, value: byDay.get(day) || 0 }))
})

// 纵轴上限：至少包含目标值，避免目标线贴顶
const maxVal = computed(() =>
  Math.max(target.value, ...series.value.map((d) => d.value), 1)
)

const targetPct = computed(() =>
  Math.min(100, Math.max(0, (target.value / maxVal.value) * 100))
)

const rangeTotal = computed(() =>
  series.value.reduce((a, b) => a + b.value, 0)
)
const rangeAvg = computed(() =>
  series.value.length ? Math.round(rangeTotal.value / series.value.length) : 0
)
const daysHit = computed(
  () => series.value.filter((d) => target.value > 0 && d.value >= target.value).length
)

// 月视图下标签太密，每 5 天显示一个 + 最后一天
function dayLabel(d, i) {
  if (range.value === 7) return weekdayLabel(d.day)
  if (i === series.value.length - 1 || i % 5 === 0) return d.day.slice(8)
  return ""
}

// ---------- 今日 KPI ----------
const todayFocusMin = computed(() =>
  state.sessions
    .filter((s) => todayKey(new Date(s.ts)) === today)
    .reduce((sum, s) => sum + s.minutes, 0)
)

const todayPomodoros = computed(
  () => state.sessions.filter((s) => todayKey(new Date(s.ts)) === today).length
)

const todayHabitRate = computed(() => {
  if (!state.habits.length) return 0
  const done = state.habits.filter(
    (h) => state.habitChecks[today] && state.habitChecks[today][h.id]
  ).length
  return Math.round((done / state.habits.length) * 100)
})

// ---------- 近 7 天习惯完成率（固定周视图） ----------
const weekHabit = computed(() =>
  lastNDays(7).map((day) => {
    const total = state.habits.length
    if (!total) return { day, rate: 0 }
    const done = state.habits.filter(
      (h) => state.habitChecks[day] && state.habitChecks[day][h.id]
    ).length
    return { day, rate: Math.round((done / total) * 100) }
  })
)

// ---------- 补记专注（记录离开番茄钟时完成的专注） ----------
const logMin = ref(25)
const logMsg = ref(null)
let logMsgTimer = null
function logSession() {
  const m = Number(logMin.value)
  if (!m || m <= 0) return
  state.sessions.push({ id: uid(), minutes: m, ts: Date.now() })
  logMsg.value = { type: "ok", text: `已补记 ${m} 分钟专注` }
  clearTimeout(logMsgTimer)
  logMsgTimer = setTimeout(() => (logMsg.value = null), 4000)
}

// ---------- 番茄按任务分布 ----------
const taskDist = computed(() => {
  const list = state.tasks
    .filter((t) => (t.pomo || 0) > 0)
    .slice()
    .sort((a, b) => (b.pomo || 0) - (a.pomo || 0))
  const max = list.length ? Math.max(...list.map((t) => t.pomo || 0)) : 1
  const total = list.reduce((a, t) => a + (t.pomo || 0), 0)
  return { list, max, total }
})
</script>

<template>
  <section class="card stats">
    <h2>📊 数据统计</h2>

    <div class="kpis">
      <div class="kpi">
        <div class="k-num">{{ todayFocusMin }}<small>分</small></div>
        <div class="k-label muted">今日专注</div>
      </div>
      <div class="kpi">
        <div class="k-num">{{ todayPomodoros }}<small>个</small></div>
        <div class="k-label muted">今日番茄</div>
      </div>
      <div class="kpi">
        <div class="k-num">{{ todayHabitRate }}<small>%</small></div>
        <div class="k-label muted">习惯完成</div>
      </div>
    </div>

    <!-- 补记：记录离开番茄钟时完成的专注 -->
    <div class="log-row">
      <span class="muted">漏记了？</span>
      <input
        type="number"
        min="1"
        max="240"
        v-model.number="logMin"
        @keyup.enter="logSession"
      />
      <span class="muted">分</span>
      <button class="btn small primary" @click="logSession">补记专注</button>
      <span v-if="logMsg" class="log-msg" :class="logMsg.type">{{ logMsg.text }}</span>
    </div>

    <!-- 趋势图：周/月切换 + 指标切换 + 目标线 -->
    <div class="chart-block">
      <div class="chart-head">
        <div class="chart-title muted">{{ chartTitle }}</div>
        <div class="seg-group">
          <div class="seg">
            <button :class="{ active: range === 7 }" @click="range = 7">周</button>
            <button :class="{ active: range === 30 }" @click="range = 30">月</button>
          </div>
          <div class="seg">
            <button
              :class="{ active: metric === 'focus' }"
              @click="metric = 'focus'"
            >
              时长
            </button>
            <button
              :class="{ active: metric === 'pomo' }"
              @click="metric = 'pomo'"
            >
              个数
            </button>
          </div>
        </div>
      </div>

      <div class="tracks-wrap">
        <div
          v-if="target > 0"
          class="target-line"
          :style="{ bottom: targetPct + '%' }"
        >
          <span class="target-label">目标 {{ target }}{{ unit }}</span>
        </div>
        <div
          v-for="(d, i) in series"
          :key="d.day"
          class="track"
          :title="`${d.day}：${d.value}${unit}（目标 ${target}${unit}）`"
        >
          <div
            class="fill"
            :class="{ hit: target > 0 && d.value >= target }"
            :style="{ height: (d.value / maxVal) * 100 + '%' }"
          >
            <span v-if="range === 7 && d.value > 0" class="val">{{ d.value }}</span>
          </div>
        </div>
      </div>
      <div class="labels-row">
        <div v-for="(d, i) in series" :key="d.day" class="lab">
          {{ dayLabel(d, i) }}
        </div>
      </div>
      <div class="summary muted">
        近 {{ range }} 天合计 <b>{{ rangeTotal }}</b>{{ unit }} · 日均
        <b>{{ rangeAvg }}</b>{{ unit }} · 达标 <b>{{ daysHit }}</b
        >/{{ range }} 天
      </div>
    </div>

    <!-- 近 7 天习惯完成率 -->
    <div class="chart-block">
      <div class="chart-title muted">近 7 天习惯完成率</div>
      <div class="bars">
        <div class="bar-col" v-for="d in weekHabit" :key="d.day">
          <div class="bar-track">
            <div class="bar-fill habit" :style="{ height: d.rate + '%' }" />
          </div>
          <div class="bar-val">{{ d.rate ? d.rate + "%" : "" }}</div>
          <div class="bar-day">{{ weekdayLabel(d.day) }}</div>
        </div>
      </div>
    </div>

    <!-- 番茄按任务分布 -->
    <div class="chart-block">
      <div class="chart-title muted">
        番茄按任务分布<span v-if="taskDist.total"> · 共 🍅 {{ taskDist.total }}</span>
      </div>
      <div v-if="taskDist.list.length" class="task-dist">
        <div class="td-row" v-for="t in taskDist.list" :key="t.id">
          <div class="td-name" :title="t.name">{{ t.name }}</div>
          <div class="td-track">
            <div
              class="td-fill"
              :style="{ width: (t.pomo / taskDist.max) * 100 + '%' }"
            />
          </div>
          <div class="td-val">🍅 {{ t.pomo }}</div>
        </div>
      </div>
      <div v-else class="muted td-empty">
        还没有绑定任务完成的番茄，计时时绑定一个任务即可在这里看到分布
      </div>
    </div>
  </section>
</template>

<style scoped>
.kpis {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}
.kpi {
  flex: 1;
  background: var(--accent-soft);
  border-radius: 12px;
  padding: 14px;
  text-align: center;
}
.k-num {
  font-size: 26px;
  font-weight: 700;
  color: var(--accent);
}
.k-num small {
  font-size: 13px;
  font-weight: 500;
  margin-left: 2px;
  color: var(--muted);
}
.k-label {
  font-size: 12px;
  margin-top: 2px;
}

/* 补记专注 */
.log-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  margin: 14px 0 4px;
  flex-wrap: wrap;
}
.log-row input {
  width: 60px;
  padding: 5px 8px;
  border: 1px solid var(--border);
  border-radius: 8px;
  text-align: center;
}
.log-msg {
  font-size: 12px;
}
.log-msg.ok {
  color: var(--good);
}

.chart-block {
  margin-top: 18px;
}
.chart-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 10px;
}
.chart-title {
  font-size: 13px;
}
.seg-group {
  display: flex;
  gap: 8px;
}
.seg {
  display: flex;
  background: var(--bg);
  border-radius: 999px;
  padding: 2px;
}
.seg button {
  padding: 4px 12px;
  font-size: 12px;
  border-radius: 999px;
  color: var(--muted);
}
.seg button.active {
  background: var(--accent);
  color: #fff;
}

/* 趋势图主体 */
.tracks-wrap {
  position: relative;
  display: flex;
  gap: 4px;
  height: 160px;
}
.track {
  flex: 1;
  position: relative;
  background: var(--bg);
  border-radius: 6px;
  overflow: visible;
}
.fill {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--accent);
  border-radius: 6px 6px 0 0;
  min-height: 2px;
  transition: height 0.3s ease;
}
.fill.hit {
  background: var(--good);
}
.fill .val {
  position: absolute;
  top: -18px;
  left: 0;
  right: 0;
  text-align: center;
  font-size: 10px;
  color: var(--muted);
}
.target-line {
  position: absolute;
  left: 0;
  right: 0;
  border-top: 2px dashed var(--warn);
  z-index: 2;
  pointer-events: none;
}
.target-label {
  position: absolute;
  right: 2px;
  top: -18px;
  font-size: 10px;
  color: var(--warn);
  background: var(--card);
  padding: 0 4px;
  border-radius: 4px;
}
.labels-row {
  display: flex;
  gap: 4px;
  margin-top: 6px;
}
.lab {
  flex: 1;
  text-align: center;
  font-size: 10px;
  color: var(--muted);
  min-height: 12px;
}
.summary {
  font-size: 12px;
  margin-top: 10px;
}
.summary b {
  color: var(--text);
}

/* 习惯完成率图表 */
.bars {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  height: 120px;
}
.bar-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  justify-content: flex-end;
}
.bar-track {
  width: 100%;
  flex: 1;
  display: flex;
  align-items: flex-end;
  background: var(--bg);
  border-radius: 8px;
  overflow: hidden;
}
.bar-fill {
  width: 100%;
  border-radius: 8px 8px 0 0;
  transition: height 0.3s ease;
  min-height: 2px;
}
.bar-fill.habit {
  background: var(--good);
}
.bar-val {
  font-size: 11px;
  color: var(--muted);
  margin: 4px 0 2px;
  height: 14px;
}
.bar-day {
  font-size: 11px;
  color: var(--muted);
}

/* 番茄按任务分布 */
.task-dist {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 6px;
}
.td-row {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
}
.td-name {
  flex: 0 0 38%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--text);
}
.td-track {
  flex: 1;
  height: 14px;
  background: var(--bg);
  border-radius: 7px;
  overflow: hidden;
}
.td-fill {
  height: 100%;
  background: var(--accent);
  border-radius: 7px;
  transition: width 0.3s ease;
  min-width: 2px;
}
.td-val {
  flex: 0 0 auto;
  color: var(--muted);
}
.td-empty {
  font-size: 12px;
  margin-top: 6px;
}
</style>
