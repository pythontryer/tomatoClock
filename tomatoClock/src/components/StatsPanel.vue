<script setup lang="ts">
import KpiCards from './stats/KpiCards.vue'
import LogSession from './stats/LogSession.vue'
import TrendChart from './stats/TrendChart.vue'
import HabitRateChart from './stats/HabitRateChart.vue'
import TaskDistribution from './stats/TaskDistribution.vue'
</script>

<template>
  <section class="card stats">
    <h2>📊 数据统计</h2>

    <KpiCards />
    <LogSession />
    <TrendChart />
    <HabitRateChart />
    <TaskDistribution />
  </section>
</template>
