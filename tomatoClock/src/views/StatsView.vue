<script setup lang="ts">
import StatsPanel from '@/components/StatsPanel.vue'
</script>

<template>
  <div class="stats-view">
    <div class="page-header">
      <h1 class="page-title">数据统计</h1>
      <p class="page-subtitle">追踪你的专注时长、习惯完成与任务进展</p>
    </div>
    <StatsPanel />
  </div>
</template>

<style scoped>
.stats-view {
  padding-bottom: 20px;
}
</style>
