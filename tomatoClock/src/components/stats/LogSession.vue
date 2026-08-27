<script setup lang="ts">
import { ref } from 'vue'
import { useAppStore } from '@/stores/useAppStore'

const store = useAppStore()

const logMin = ref(25)
const logMsg = ref<{ type: 'ok'; text: string } | null>(null)
let logMsgTimer: ReturnType<typeof setTimeout> | null = null

// 补记专注（记录离开番茄钟时完成的专注）
function logSession() {
  const m = Number(logMin.value)
  if (!m || m <= 0) return
  store.logSession(m)
  logMsg.value = { type: 'ok', text: `已补记 ${m} 分钟专注` }
  if (logMsgTimer) clearTimeout(logMsgTimer)
  logMsgTimer = setTimeout(() => (logMsg.value = null), 4000)
}
</script>

<template>
  <div class="log-row">
    <span class="muted">漏记了？</span>
    <input v-model.number="logMin" type="number" min="1" max="240" @keyup.enter="logSession" />
    <span class="muted">分</span>
    <button class="btn small primary" @click="logSession">补记专注</button>
    <span v-if="logMsg" class="log-msg" :class="logMsg.type">{{ logMsg.text }}</span>
  </div>
</template>

<style scoped>
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
</style>
