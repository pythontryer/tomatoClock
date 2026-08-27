<script setup lang="ts">
import { ref } from 'vue'
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

// ---------- 导出 ----------
function exportData() {
  try {
    const blob = new Blob([JSON.stringify(store.$state, null, 2)], {
      type: 'application/json'
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `focus-habit-backup-${todayKey()}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
    msg.value = { type: 'ok', text: '已导出备份文件' }
  } catch (e) {
    msg.value = { type: 'err', text: '导出失败：' + (e as Error).message }
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
        msg.value = { type: 'err', text: `文件格式不正确：${res.error}` }
        pending.value = null
      } else if (res.data) {
        const clean = res.data
        pending.value = clean
        const parts = [`${clean.habits.length} 个习惯`, `${clean.sessions.length} 条专注`]
        if (clean.present.tasks) parts.push(`${clean.tasks.length} 个任务`)
        let text = `「${file.name}」校验通过：${parts.join(' / ')}。`
        const totalSkip = res.skipped.habits + res.skipped.sessions + res.skipped.tasks
        if (totalSkip > 0) {
          text += `已跳过 ${totalSkip} 条异常记录（缺字段或数值非法）。`
        }
        text += '请选择导入方式'
        msg.value = { type: 'ok', text }
      }
    } catch (err) {
      msg.value = { type: 'err', text: '文件不是有效的 JSON：' + (err as Error).message }
    }
    input.value = '' // 允许重复选择同一文件
  }
  reader.onerror = () => {
    msg.value = { type: 'err', text: '文件读取失败，请重试' }
  }
  reader.readAsText(file)
}

// ---------- 应用导入 ----------
function applyImport(mode: 'overwrite' | 'merge') {
  const data = pending.value
  if (!data) return
  if (mode === 'overwrite') {
    store.overwrite(data)
    msg.value = { type: 'ok', text: '导入成功（已覆盖本地数据）' }
  } else {
    store.merge(data)
    msg.value = { type: 'ok', text: '导入成功（已与本地数据合并）' }
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
    <h2>💾 数据备份 <span class="muted sub">换设备不丢数据</span></h2>

    <div class="row">
      <button class="btn primary" @click="exportData">导出 JSON</button>
      <button class="btn" @click="pickFile">导入 JSON</button>
      <input
        ref="fileInput"
        type="file"
        accept="application/json,.json"
        style="display: none"
        @change="onFileChange"
      />
    </div>

    <div v-if="pending" class="confirm">
      <span class="muted">如何处理「{{ fileName }}」的数据？</span>
      <button class="btn primary" @click="applyImport('overwrite')">覆盖本地</button>
      <button class="btn" @click="applyImport('merge')">合并到本地</button>
      <button class="btn ghost" @click="cancelImport">取消</button>
    </div>

    <p v-if="msg" class="msg" :class="msg.type">{{ msg.text }}</p>
  </section>
</template>

<style scoped>
.sub {
  font-size: 12px;
  font-weight: 400;
  margin-left: 8px;
}
.row {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
.confirm {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 14px;
  padding: 12px;
  background: var(--accent-soft);
  border-radius: 10px;
  font-size: 13px;
}
.msg {
  margin: 10px 0 0;
  font-size: 13px;
}
.msg.ok {
  color: var(--good);
}
.msg.err {
  color: var(--warn);
}
</style>
