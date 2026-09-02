<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAppStore } from '@/stores/useAppStore'
import { plantStage, getFocusLevel } from '@/constants'

const store = useAppStore()

const generating = ref(false)

// 本周日期范围（周一到周日）
const weekRange = computed(() => {
  const now = new Date()
  const day = now.getDay() || 7 // 周日=7
  const monday = new Date(now)
  monday.setDate(now.getDate() - day + 1)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  const fmt = (d: Date) => `${d.getMonth() + 1}月${d.getDate()}日`
  return `${fmt(monday)} - ${fmt(sunday)}`
})

// 本周专注数据
const weekData = computed(() => {
  const now = new Date()
  const day = now.getDay() || 7
  const monday = new Date(now)
  monday.setDate(now.getDate() - day + 1)
  monday.setHours(0, 0, 0, 0)

  const weekSessions = store.sessions.filter((s) => {
    const d = new Date(s.ts)
    return d >= monday
  })

  const totalMinutes = weekSessions.reduce((sum, s) => sum + (s.minutes || 0), 0)
  const pomoCount = weekSessions.length

  // 习惯完成率
  let habitTotal = 0
  let habitDone = 0
  const weekDays: string[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    if (d > now) break
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    weekDays.push(key)
  }
  store.habits.forEach((h) => {
    weekDays.forEach((dateKey) => {
      habitTotal++
      if (store.habitChecks[dateKey]?.[h.id]) habitDone++
    })
  })
  const habitRate = habitTotal > 0 ? Math.round((habitDone / habitTotal) * 100) : 0

  return {
    totalMinutes: Math.round(totalMinutes),
    pomoCount,
    habitRate,
    hours: Math.floor(totalMinutes / 60),
    mins: Math.round(totalMinutes % 60)
  }
})

const stageName = computed(() => {
  const names = ['种子', '发芽', '成长', '绽放']
  return names[plantStage(store.pomoCycle)] || '绽放'
})

const level = computed(() => getFocusLevel(store.pomoCycle))

// 鼓励语
const encourageText = computed(() => {
  const mins = weekData.value.totalMinutes
  if (mins >= 600) return '专注达人，本周表现出色！'
  if (mins >= 300) return '稳步前进，继续保持这份专注！'
  if (mins >= 120) return '不错的开始，下周再接再厉！'
  return '每一份专注都在积累，下周加油！'
})

/** 生成周报图片并下载 */
async function generateReport() {
  generating.value = true
  try {
    const canvas = document.createElement('canvas')
    const W = 750
    const H = 1200
    canvas.width = W
    canvas.height = H
    const ctx = canvas.getContext('2d')!

    // 背景渐变
    const bg = ctx.createLinearGradient(0, 0, 0, H)
    bg.addColorStop(0, '#667eea')
    bg.addColorStop(0.5, '#764ba2')
    bg.addColorStop(1, '#f093fb')
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, W, H)

    // 装饰圆
    ctx.fillStyle = 'rgba(255,255,255,0.08)'
    ctx.beginPath()
    ctx.arc(650, 150, 120, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(80, 1050, 150, 0, Math.PI * 2)
    ctx.fill()

    // 白色卡片
    const cardX = 50
    const cardY = 280
    const cardW = W - 100
    const cardH = 780
    ctx.fillStyle = '#ffffff'
    ctx.shadowColor = 'rgba(0,0,0,0.15)'
    ctx.shadowBlur = 30
    ctx.shadowOffsetY = 10
    roundRect(ctx, cardX, cardY, cardW, cardH, 24)
    ctx.fill()
    ctx.shadowColor = 'transparent'

    // 标题
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 42px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('本周专注报告', W / 2, 130)
    ctx.font = '22px sans-serif'
    ctx.fillStyle = 'rgba(255,255,255,0.85)'
    ctx.fillText(weekRange.value, W / 2, 175)

    // 植物 emoji + 等级
    ctx.font = '80px sans-serif'
    ctx.fillText(level.value.icon, W / 2, 250)

    // 数据行 1：专注时长
    const dataY = cardY + 80
    ctx.fillStyle = '#333'
    ctx.font = 'bold 56px sans-serif'
    ctx.fillText(`${weekData.value.hours}小时${weekData.value.mins}分`, W / 2, dataY)
    ctx.font = '20px sans-serif'
    ctx.fillStyle = '#888'
    ctx.fillText('本周专注总时长', W / 2, dataY + 40)

    // 分割线
    ctx.strokeStyle = '#eee'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(cardX + 40, dataY + 80)
    ctx.lineTo(cardX + cardW - 40, dataY + 80)
    ctx.stroke()

    // 三个数据格
    const gridY = dataY + 140
    const gridW = (cardW - 80) / 3
    const stats = [
      { label: '完成番茄', value: `${weekData.value.pomoCount}`, unit: '个' },
      { label: '习惯完成率', value: `${weekData.value.habitRate}`, unit: '%' },
      { label: '小园阶段', value: stageName.value, unit: '' }
    ]
    stats.forEach((s, i) => {
      const x = cardX + 40 + gridW * i + gridW / 2
      ctx.fillStyle = '#5b6cff'
      ctx.font = 'bold 36px sans-serif'
      ctx.fillText(s.value + s.unit, x, gridY)
      ctx.fillStyle = '#999'
      ctx.font = '18px sans-serif'
      ctx.fillText(s.label, x, gridY + 35)
    })

    // 分割线
    ctx.beginPath()
    ctx.moveTo(cardX + 40, gridY + 70)
    ctx.lineTo(cardX + cardW - 40, gridY + 70)
    ctx.stroke()

    // 等级信息
    ctx.fillStyle = '#333'
    ctx.font = '24px sans-serif'
    ctx.fillText(`专注等级：${level.value.name}`, W / 2, gridY + 130)
    ctx.fillStyle = '#666'
    ctx.font = '20px sans-serif'
    ctx.fillText(`累计 ${store.pomoCycle} 个番茄`, W / 2, gridY + 165)

    // 鼓励语
    ctx.fillStyle = '#ff6b6b'
    ctx.font = 'bold 26px sans-serif'
    ctx.fillText(encourageText.value, W / 2, gridY + 230)

    // 底部
    ctx.fillStyle = 'rgba(255,255,255,0.9)'
    ctx.font = '20px sans-serif'
    ctx.fillText('专注与习惯面板', W / 2, H - 60)
    ctx.fillStyle = 'rgba(255,255,255,0.6)'
    ctx.font = '16px sans-serif'
    ctx.fillText('数据全本地 · 隐私安全', W / 2, H - 30)

    // 下载
    const link = document.createElement('a')
    link.download = `专注周报-${weekRange.value.replace(/ /g, '')}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  } finally {
    generating.value = false
  }
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}
</script>

<template>
  <section class="card weekly-report">
    <h3 class="section-title">📊 本周专注报告</h3>
    <p class="desc muted">{{ weekRange }} · 生成专属周报图片，分享到朋友圈或小红书</p>
    <div class="report-preview">
      <div class="preview-item">
        <span class="preview-val">{{ weekData.hours }}h{{ weekData.mins }}m</span>
        <span class="preview-label">专注时长</span>
      </div>
      <div class="preview-item">
        <span class="preview-val">{{ weekData.pomoCount }}</span>
        <span class="preview-label">番茄数</span>
      </div>
      <div class="preview-item">
        <span class="preview-val">{{ weekData.habitRate }}%</span>
        <span class="preview-label">习惯完成率</span>
      </div>
      <div class="preview-item">
        <span class="preview-val">{{ stageName }}</span>
        <span class="preview-label">小园阶段</span>
      </div>
    </div>
    <button class="btn primary full" :disabled="generating" @click="generateReport">
      {{ generating ? '生成中…' : '📸 生成周报图片并保存' }}
    </button>
  </section>
</template>

<style scoped>
.weekly-report h3 {
  margin: 0 0 6px;
  font-size: 16px;
  font-weight: 700;
}
.desc {
  font-size: 13px;
  line-height: 1.6;
  margin: 0 0 16px;
}
.report-preview {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  margin-bottom: 16px;
}
.preview-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 8px;
  background: var(--accent-soft);
  border-radius: var(--radius-sm);
}
.preview-val {
  font-size: 18px;
  font-weight: 700;
  color: var(--accent);
}
.preview-label {
  font-size: 11px;
  color: var(--muted);
}
.btn.full {
  width: 100%;
}
.btn.primary {
  background: linear-gradient(135deg, #5b6cff, #764ba2);
  color: #fff;
  border: none;
}
.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
