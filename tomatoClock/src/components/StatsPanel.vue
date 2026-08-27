<script setup lang="ts">
import KpiCards from './stats/KpiCards.vue'
import LogSession from './stats/LogSession.vue'
import TrendChart from './stats/TrendChart.vue'
import HabitRateChart from './stats/HabitRateChart.vue'
import TaskDistribution from './stats/TaskDistribution.vue'
import TaskEstimateVariance from './stats/TaskEstimateVariance.vue'
import FocusHeatmap from './stats/FocusHeatmap.vue'
import SessionReflection from './stats/SessionReflection.vue'
</script>

<template>
  <section class="card stats">
    <h2>📊 数据统计</h2>

    <KpiCards />
    <LogSession />
    <TrendChart />
    <FocusHeatmap />
    <HabitRateChart />
    <TaskEstimateVariance />
    <SessionReflection />
    <TaskDistribution />
  </section>
</template>
