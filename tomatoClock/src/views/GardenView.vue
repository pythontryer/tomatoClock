<script setup lang="ts">
import { computed } from 'vue'
import Companion from '@/components/Companion.vue'
import CompanionShop from '@/components/CompanionShop.vue'
import { useAppStore } from '@/stores/useAppStore'
import { plantStage } from '@/constants'

const store = useAppStore()

const stage = computed(() => plantStage(store.pomoCycle))
const stageNames = ['种子', '发芽', '成长', '绽放']
const stageName = computed(() => stageNames[stage.value] || '绽放')
</script>

<template>
  <div class="garden-view">
    <!-- 大号植物展示区 -->
    <section class="card garden-hero">
      <div class="hero-header">
        <h2>🌱 我的专注小园</h2>
        <div class="stage-badge">阶段：{{ stageName }}</div>
      </div>

      <div class="hero-plant">
        <Companion
          mood="idle"
          :skin-id="store.companion.activeCompanion"
          :stage="stage"
          celebration=""
          :name="store.companion.name"
        />
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

      <p class="hero-tip muted">每完成 4 个番茄，小园就会成长一个阶段~</p>
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
}
.hero-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
.hero-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
}
.stage-badge {
  font-size: 12px;
  font-weight: 600;
  padding: 5px 12px;
  border-radius: 999px;
  background: var(--accent-soft);
  color: var(--accent);
}
.hero-plant {
  padding: 20px 0;
  display: flex;
  justify-content: center;
}
.hero-plant :deep(.companion) {
  width: 180px;
}
.hero-stats {
  display: flex;
  justify-content: center;
  gap: 32px;
  margin: 16px 0;
  padding: 16px;
  background: var(--accent-soft);
  border-radius: var(--radius-sm);
}
.stat {
  text-align: center;
}
.stat-val {
  font-size: 28px;
  font-weight: 800;
  background: var(--accent-gradient);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  font-variant-numeric: tabular-nums;
}
.stat-label {
  font-size: 12px;
  color: var(--muted);
  margin-top: 4px;
  font-weight: 500;
}
.hero-tip {
  font-size: 12px;
  margin: 0;
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
