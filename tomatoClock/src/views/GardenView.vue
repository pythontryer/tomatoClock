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
        />
      </div>

      <div class="stage-badge">
        <span class="stage-label">当前阶段</span>
        <span class="stage-name">{{ stageName }}</span>
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
