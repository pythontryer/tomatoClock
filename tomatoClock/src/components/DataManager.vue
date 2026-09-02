<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAppStore } from '@/stores/useAppStore'
import { todayKey } from '@/utils/date'
import { sanitize } from '@/utils/importExport'
import type { SanitizedData } from '@/utils/importExport'

const store = useAppStore()

const fileInput = ref<HTMLInputElement | null>(null)
// 待确认的导入数据（已通过校验）
const pending = ref<SanitizedData | null>(null)
const msg = ref<{ type: 'ok' | 'err'; text: string } | null>(null)
const fileName = ref('')

// 导出内容概览，用于话术
const exportSummary = computed(() => {
  const habits = store.habits.length
  const sessions = store.sessions.length
  const tasks = store.tasks.length
  const coins = store.companion.coins
  const pomo = store.pomoCycle
  return { habits, sessions, tasks, coins, pomo }
})

// ---------- 导出 ----------
function exportData() {
  try {
    const blob = new Blob([JSON.stringify(store.$state, null, 2)], {
      type: 'application/json'
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `专注与习惯-备份-${todayKey()}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
    const s = exportSummary.value
    msg.value = {
      type: 'ok',
      text: `✅ 备份已下载！包含 ${s.sessions} 条专注记录、${s.habits} 个习惯、${s.tasks} 个任务，以及小园的 ${s.coins} 滴露珠和 ${s.pomo} 个番茄成长。文件已保存到你的下载目录。`
    }
  } catch (e) {
    msg.value = { type: 'err', text: '❌ 导出失败：' + (e as Error).message + '，请重试' }
  }
}

// ---------- 导入：读取 + 校验 ----------
function pickFile() {
  msg.value = null
  pending.value = null
  fileInput.value?.click()
}

function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files && input.files[0]
  if (!file) return
  fileName.value = file.name
  const reader = new FileReader()
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result as string) as unknown
      const res = sanitize(data)
      if (res.error) {
        msg.value = { type: 'err', text: `❌ 「${file.name}」不是有效的备份文件：${res.error}` }
        pending.value = null
      } else if (res.data) {
        const clean = res.data
        pending.value = clean
        const parts = [
          `${clean.habits.length} 个习惯`,
          `${clean.sessions.length} 条专注记录`
        ]
        if (clean.present.tasks) parts.push(`${clean.tasks.length} 个任务`)
        parts.push('小园成长数据')
        msg.value = {
          type: 'ok',
          text: `📋 「${file.name}」校验通过，包含 ${parts.join('、')}。请选择导入方式：`
        }
      }
    } catch {
      msg.value = {
        type: 'err',
        text: `❌ 「${file.name}」文件读取失败，请确认是从本应用导出的备份文件`
      }
    }
  }
  reader.onerror = () => {
    msg.value = { type: 'err', text: '❌ 文件读取失败，请重试' }
  }
  reader.readAsText(file)
  input.value = '' // 允许重复选择同一文件
}

// ---------- 应用导入 ----------
function applyImport(mode: 'overwrite' | 'merge') {
  const data = pending.value
  if (!data) return
  if (mode === 'overwrite') {
    store.overwrite(data)
    msg.value = { type: 'ok', text: '✅ 导入成功！已用备份数据覆盖当前数据，小园和专注记录都已恢复。' }
  } else {
    store.merge(data)
    msg.value = { type: 'ok', text: '✅ 导入成功！备份数据已合并到当前数据中，原有数据保留。' }
  }
  pending.value = null
}

function cancelImport() {
  pending.value = null
  msg.value = null
}
</script>

<template>
  <section class="card data">
    <h2>💾 数据备份与迁移</h2>
    <p class="desc muted">
      一键导出你的专注记录、习惯打卡、任务清单和小园成长数据。换设备、清浏览器前记得备份，数据不会上传到任何服务器。
    </p>

    <div class="row">
      <button class="btn primary" @click="exportData">📤 导出全部数据</button>
      <button class="btn" @click="pickFile">📥 导入备份文件</button>
      <input
        ref="fileInput"
        type="file"
        accept="application/json,.json"
        style="display: none"
        @change="onFileChange"
      />
    </div>

    <div v-if="pending" class="confirm">
      <div class="confirm-title">选择导入方式</div>
      <div class="confirm-options">
        <button class="btn primary" @click="applyImport('overwrite')">
          覆盖当前数据
          <small>用备份完全替换现有内容</small>
        </button>
        <button class="btn" @click="applyImport('merge')">
          合并到当前数据
          <small>保留现有数据，追加备份内容</small>
        </button>
        <button class="btn ghost" @click="cancelImport">取消</button>
      </div>
    </div>

    <p v-if="msg" class="msg" :class="msg.type">{{ msg.text }}</p>
  </section>
</template>

<style scoped>
.data h2 {
  margin: 0 0 6px;
  font-size: 16px;
  font-weight: 700;
}
.desc {
  font-size: 13px;
  line-height: 1.7;
  margin: 0 0 16px;
}
.row {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
.confirm {
  margin-top: 16px;
  padding: 16px;
  background: linear-gradient(135deg, var(--accent-soft), rgba(139, 92, 246, 0.06));
  border-radius: var(--radius-sm);
  border: 1px solid rgba(91, 108, 255, 0.12);
  animation: slideIn 0.3s ease;
}
@keyframes slideIn {
  from { opacity: 0; transform: translateY(-8px); }
  to { opacity: 1; transform: translateY(0); }
}
.confirm-title {
  font-size: 14px;
  font-weight: 700;
  margin-bottom: 12px;
  color: var(--text);
}
.confirm-options {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: stretch;
}
.confirm-options .btn {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  padding: 10px 16px;
  text-align: left;
}
.confirm-options .btn small {
  font-size: 11px;
  font-weight: 400;
  opacity: 0.8;
}
.msg {
  margin: 14px 0 0;
  font-size: 13px;
  line-height: 1.7;
  padding: 12px 16px;
  border-radius: var(--radius-sm);
  animation: slideIn 0.3s ease;
}
.msg.ok {
  color: var(--good);
  background: rgba(43, 191, 138, 0.08);
  border: 1px solid rgba(43, 191, 138, 0.15);
}
.msg.err {
  color: var(--warn);
  background: rgba(255, 174, 66, 0.08);
  border: 1px solid rgba(255, 174, 66, 0.15);
}
</style>
