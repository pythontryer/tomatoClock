<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAppStore } from '@/stores/useAppStore'
import { useSound } from '@/composables/useSound'
import { SOUND_OPTIONS } from '@/constants'

const store = useAppStore()
const { previewSound } = useSound()

const fileInput = ref<HTMLInputElement | null>(null)
const msg = ref<{ type: 'ok' | 'err'; text: string } | null>(null)

// 录音状态
const recording = ref(false)
const recordSeconds = ref(0)
let mediaRecorder: MediaRecorder | null = null
let recordChunks: Blob[] = []
let recordTimer: ReturnType<typeof setInterval> | null = null
let recordStream: MediaStream | null = null

const MAX_CUSTOM = 5
const canAdd = computed(() => store.settings.customSounds.length < MAX_CUSTOM)

function showMsg(type: 'ok' | 'err', text: string) {
  msg.value = { type, text }
  setTimeout(() => (msg.value = null), 3500)
}

// ---------- 上传 ----------
function pickFile() {
  if (!canAdd.value) {
    showMsg('err', `最多保存 ${MAX_CUSTOM} 个自定义提示音，请先删除一个`)
    return
  }
  fileInput.value?.click()
}

function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  if (!file.type.startsWith('audio/')) {
    showMsg('err', '请选择音频文件（mp3、wav、ogg 等）')
    input.value = ''
    return
  }
  if (file.size > 500 * 1024) {
    showMsg('err', '文件过大（超过 500KB），请选择更短的音频')
    input.value = ''
    return
  }
  const reader = new FileReader()
  reader.onload = () => {
    const data = reader.result as string
    const name = file.name.replace(/\.[^.]+$/, '').slice(0, 16)
    const id = store.addCustomSound(name, data)
    if (id) {
      showMsg('ok', `已添加提示音「${name}」`)
    } else {
      showMsg('err', '添加失败，可能已达数量上限')
    }
  }
  reader.onerror = () => showMsg('err', '文件读取失败')
  reader.readAsDataURL(file)
  input.value = ''
}

// ---------- 录音 ----------
async function startRecording() {
  if (!canAdd.value) {
    showMsg('err', `最多保存 ${MAX_CUSTOM} 个自定义提示音，请先删除一个`)
    return
  }
  try {
    recordStream = await navigator.mediaDevices.getUserMedia({ audio: true })
    recordChunks = []
    mediaRecorder = new MediaRecorder(recordStream)
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) recordChunks.push(e.data)
    }
    mediaRecorder.onstop = () => {
      const blob = new Blob(recordChunks, { type: mediaRecorder?.mimeType || 'audio/webm' })
      const reader = new FileReader()
      reader.onload = () => {
        const data = reader.result as string
        const name = `录音 ${new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`
        const id = store.addCustomSound(name, data)
        if (id) {
          showMsg('ok', `录音已保存（${recordSeconds.value} 秒）`)
        } else {
          showMsg('err', '保存失败')
        }
        cleanupRecording()
      }
      reader.readAsDataURL(blob)
    }
    mediaRecorder.start()
    recording.value = true
    recordSeconds.value = 0
    recordTimer = setInterval(() => {
      recordSeconds.value++
      if (recordSeconds.value >= 15) stopRecording() // 最长 15 秒
    }, 1000)
  } catch {
    showMsg('err', '无法访问麦克风，请检查浏览器权限设置')
    cleanupRecording()
  }
}

function stopRecording() {
  if (mediaRecorder && recording.value) {
    mediaRecorder.stop()
    recording.value = false
  }
}

function cleanupRecording() {
  if (recordTimer) clearInterval(recordTimer)
  recordTimer = null
  if (recordStream) {
    recordStream.getTracks().forEach((t) => t.stop())
    recordStream = null
  }
  mediaRecorder = null
}

// ---------- 预览/选用/删除 ----------
function preview(id: string) {
  previewSound(id)
}

function selectSound(id: string) {
  store.settings.soundType = id
  showMsg('ok', '已设为当前提示音')
}

function removeSound(id: string) {
  const sound = store.settings.customSounds.find((s) => s.id === id)
  store.removeCustomSound(id)
  showMsg('ok', `已删除「${sound?.name || '提示音'}」`)
}
</script>

<template>
  <section class="card sound-customizer">
    <h3 class="section-title">🔔 提示音设置</h3>
    <p class="desc muted">
      选择预设提示音，或上传自己的音频、直接录音作为提示音。
    </p>

    <!-- 当前选择 -->
    <div class="current-row">
      <span class="current-label">当前提示音</span>
      <select v-model="store.settings.soundType" class="sound-select">
        <optgroup label="预设">
          <option v-for="o in SOUND_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option>
        </optgroup>
        <optgroup v-if="store.settings.customSounds.length" label="自定义">
          <option v-for="s in store.settings.customSounds" :key="s.id" :value="s.id">{{ s.name }}</option>
        </optgroup>
      </select>
      <button class="btn small" @click="preview(store.settings.soundType)">试听</button>
    </div>

    <!-- 上传和录音 -->
    <div class="actions">
      <button class="btn" :disabled="!canAdd" @click="pickFile">📁 上传音频</button>
      <button
        class="btn"
        :class="{ recording: recording }"
        @click="recording ? stopRecording : startRecording"
      >
        {{ recording ? `⏹ 停止录音 (${recordSeconds}s)` : '🎙 录音' }}
      </button>
      <input
        ref="fileInput"
        type="file"
        accept="audio/*"
        style="display: none"
        @change="onFileChange"
      />
    </div>
    <p v-if="recording" class="recording-hint">正在录音…最长 15 秒，点击停止保存</p>

    <!-- 自定义提示音列表 -->
    <div v-if="store.settings.customSounds.length" class="custom-list">
      <div v-for="s in store.settings.customSounds" :key="s.id" class="custom-item">
        <span class="custom-name">{{ s.name }}</span>
        <div class="custom-actions">
          <button class="btn small" @click="preview(s.id)">▶ 试听</button>
          <button
            v-if="store.settings.soundType !== s.id"
            class="btn small primary"
            @click="selectSound(s.id)"
          >
            选用
          </button>
          <span v-else class="using-tag">使用中</span>
          <button class="btn small ghost" @click="removeSound(s.id)">删除</button>
        </div>
      </div>
    </div>

    <p v-if="msg" class="msg" :class="msg.type">{{ msg.text }}</p>
  </section>
</template>

<style scoped>
.sound-customizer h3 {
  margin: 0 0 6px;
  font-size: 16px;
  font-weight: 700;
}
.desc {
  font-size: 13px;
  line-height: 1.6;
  margin: 0 0 16px;
}
.current-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
}
.current-label {
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
}
.sound-select {
  flex: 1;
  padding: 8px 12px;
  border: 1.5px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--card);
  color: var(--text);
  font-size: 13px;
}
.sound-select:focus {
  border-color: var(--accent);
  outline: none;
  box-shadow: 0 0 0 3px rgba(91, 108, 255, 0.1);
}
.actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
.btn.recording {
  background: linear-gradient(135deg, #ff6b6b, #ffae42);
  color: #fff;
  animation: pulse 1s infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}
.recording-hint {
  font-size: 12px;
  color: var(--warn);
  margin: 8px 0 0;
  font-weight: 500;
}
.custom-list {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.custom-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 12px;
  background: var(--accent-soft);
  border-radius: var(--radius-sm);
}
.custom-name {
  font-size: 13px;
  font-weight: 600;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.custom-actions {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}
.using-tag {
  font-size: 11px;
  font-weight: 700;
  color: var(--good);
  padding: 4px 10px;
  background: rgba(43, 191, 138, 0.1);
  border-radius: 999px;
}
.msg {
  margin: 12px 0 0;
  font-size: 12px;
  padding: 8px 12px;
  border-radius: 8px;
  line-height: 1.5;
}
.msg.ok {
  color: var(--good);
  background: rgba(43, 191, 138, 0.08);
}
.msg.err {
  color: var(--warn);
  background: rgba(255, 174, 66, 0.08);
}
</style>
