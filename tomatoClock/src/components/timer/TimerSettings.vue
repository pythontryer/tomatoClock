<script setup lang="ts">
import { useAppStore } from '@/stores/useAppStore'

const store = useAppStore()
</script>

<template>
  <div class="settings">
    <label>
      专注时长
      <input v-model.number="store.settings.focusMin" type="number" min="1" max="120" />
      分
    </label>
    <label>
      短休时长
      <input v-model.number="store.settings.breakMin" type="number" min="1" max="60" />
      分
    </label>
  </div>
  <div class="settings">
    <label>
      长休时长
      <input v-model.number="store.settings.longBreakMin" type="number" min="1" max="60" />
      分
    </label>
    <label>
      每
      <input v-model.number="store.settings.longBreakInterval" type="number" min="1" max="12" />
      个长休
    </label>
    <label class="auto">
      <input v-model="store.settings.autoStart" type="checkbox" />
      <span>自动开始下一段</span>
    </label>
  </div>
  <div class="settings">
    <label>
      每日专注目标
      <input v-model.number="store.settings.dailyFocusTarget" type="number" min="0" max="960" />
      分
    </label>
    <label>
      每日番茄目标
      <input v-model.number="store.settings.dailyPomoTarget" type="number" min="0" max="40" />
      个
    </label>
  </div>
</template>

<style scoped>
.settings {
  display: flex;
  gap: 18px;
  margin-top: 10px;
  font-size: 13px;
  color: var(--muted);
}
.settings label {
  display: inline-flex;
  align-items: center;
}
.settings input {
  width: 52px;
  padding: 4px 6px;
  border: 1px solid var(--border);
  border-radius: 8px;
  text-align: center;
  margin: 0 4px;
}
.auto {
  gap: 5px;
  cursor: pointer;
}
</style>
