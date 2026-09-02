<script setup lang="ts">
import { computed, ref } from 'vue'
import Companion from '@/components/Companion.vue'
import CompanionShop from '@/components/CompanionShop.vue'
import { useAppStore } from '@/stores/useAppStore'
import { plantStage, getFocusLevel, getNextLevel } from '@/constants'

const store = useAppStore()

const stage = computed(() => plantStage(store.pomoCycle))
const stageNames = ['种子', '发芽', '成长', '绽放']
const stageName = computed(() => stageNames[stage.value] || '绽放')

// 专注等级
const currentLevel = computed(() => getFocusLevel(store.pomoCycle))
const nextLevel = computed(() => getNextLevel(store.pomoCycle))
const levelProgress = computed(() => {
  if (!nextLevel.value) return 100
  const prev = currentLevel.value.minPomo
  const next = nextLevel.value.minPomo
  return Math.min(100, Math.round(((store.pomoCycle - prev) / (next - prev)) * 100))
})

// 浇水反馈
const tendMsg = ref<string | null>(null)
let tendTimer: ReturnType<typeof setTimeout> | null = null

function onTend() {
  const ok = store.tendCompanion()
  if (tendTimer) clearTimeout(tendTimer)
  tendMsg.value = ok ? '💧 浇水成功！小绿很开心~' : '💧 露珠不足，完成专注获取更多露珠吧'
  tendTimer = setTimeout(() => (tendMsg.value = null), ok ? 1800 : 2500)
}
</script>

<template>
  <div class="garden-view">
    <div class="page-header">
      <h1 class="page-title">专注小园</h1>
      <p class="page-subtitle">每完成 4 个番茄，小园就会成长一个阶段</p>
    </div>

    <!-- 大号植物展示区 -->
    <section class="card garden-hero">
      <div class="hero-plant">
        <Companion
          mood="idle"
          :skin-id="store.companion.activeCompanion"
          :stage="stage"
          celebration=""
          :name="store.companion.name"
          @tend="onTend"
        />
      </div>

      <transition name="fade">
        <div v-if="tendMsg" class="tend-msg">{{ tendMsg }}</div>
      </transition>

      <div class="stage-badge">
        <span class="stage-label">当前阶段</span>
        <span class="stage-name">{{ stageName }}</span>
      </div>

      <!-- 专注等级 -->
      <div class="focus-level">
        <div class="level-header">
          <span class="level-icon">{{ currentLevel.icon }}</span>
          <span class="level-name">{{ currentLevel.name }}</span>
          <span class="level-pomo">累计 {{ store.pomoCycle }} 番茄</span>
        </div>
        <div v-if="nextLevel" class="level-progress">
          <div class="level-progress-bar">
            <div class="level-progress-fill" :style="{ width: levelProgress + '%' }"></div>
          </div>
          <span class="level-progress-text">
            再完成 {{ nextLevel.minPomo - store.pomoCycle }} 个番茄升级为「{{ nextLevel.name }}」
          </span>
        </div>
        <div v-else class="level-max">已达最高等级，继续保持！</div>
      </div>

      <div class="hero-stats">
        <div class="stat">
          <div class="stat-val">{{ store.pomoCycle }}</div>
          <div class="stat-label">累计番茄</div>
        </div>
        <div class="stat">
          <div class="stat-val">{{ store.companion.coins }}</div>
          <div class="stat-label">专注露珠</div>
        </div>
        <div class="stat">
          <div class="stat-val">{{ store.sessions.length }}</div>
          <div class="stat-label">专注记录</div>
        </div>
      </div>
    </section>

    <!-- 商店和自定义 -->
    <CompanionShop />
  </div>
</template>

<style scoped>
.garden-view {
  padding-bottom: 20px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.garden-hero {
  text-align: center;
  padding: 28px 22px;
}
.hero-plant {
  padding: 8px 0 16px;
  display: flex;
  justify-content: center;
}
.hero-plant :deep(.companion) {
  width: 160px;
}
.tend-msg {
  font-size: 13px;
  font-weight: 600;
  color: var(--accent);
  margin-bottom: 14px;
  padding: 6px 14px;
  background: var(--accent-soft);
  border-radius: 999px;
  display: inline-block;
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
.stage-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 16px;
  border-radius: 999px;
  background: var(--accent-soft);
  margin-bottom: 18px;
}
.stage-label {
  font-size: 12px;
  color: var(--muted);
  font-weight: 500;
}
.stage-name {
  font-size: 14px;
  font-weight: 700;
  color: var(--accent);
}
/* 专注等级 */
.focus-level {
  width: 100%;
  max-width: 320px;
  margin: 0 auto 16px;
  padding: 12px 16px;
  background: linear-gradient(135deg, rgba(255, 174, 66, 0.08), rgba(255, 107, 107, 0.08));
  border-radius: var(--radius);
  border: 1px solid rgba(255, 174, 66, 0.2);
}
.level-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.level-icon {
  font-size: 20px;
}
.level-name {
  font-size: 14px;
  font-weight: 700;
  color: var(--text);
}
.level-pomo {
  margin-left: auto;
  font-size: 11px;
  color: var(--muted);
}
.level-progress-bar {
  height: 6px;
  background: rgba(0, 0, 0, 0.08);
  border-radius: 999px;
  overflow: hidden;
  margin-bottom: 6px;
}
.level-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #ffae42, #ff6b6b);
  border-radius: 999px;
  transition: width 0.6s ease;
}
.level-progress-text {
  font-size: 11px;
  color: var(--muted);
}
.level-max {
  font-size: 12px;
  color: var(--good);
  font-weight: 600;
  text-align: center;
}
.hero-stats {
  display: flex;
  justify-content: center;
  gap: 28px;
  padding: 18px 20px;
  background: linear-gradient(135deg, var(--accent-soft), rgba(139, 92, 246, 0.05));
  border-radius: var(--radius-sm);
}
.stat {
  text-align: center;
}
.stat-val {
  font-size: 26px;
  font-weight: 800;
  background: var(--accent-gradient);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  font-variant-numeric: tabular-nums;
  line-height: 1.2;
}
.stat-label {
  font-size: 11px;
  color: var(--muted);
  margin-top: 4px;
  font-weight: 500;
}
@media (max-width: 480px) {
  .hero-stats {
    gap: 16px;
  }
  .stat-val {
    font-size: 22px;
  }
}
</style>
