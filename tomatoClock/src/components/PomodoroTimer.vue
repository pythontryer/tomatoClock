<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useTimer } from '@/composables/useTimer'
import { useSound } from '@/composables/useSound'
import { useNotification } from '@/composables/useNotification'
import { useAppStore } from '@/stores/useAppStore'
import { SOUND_OPTIONS, focusCoins, FOCUS_GIFTS, getCelebration, plantStage } from '@/constants'
import TimerSettings from './timer/TimerSettings.vue'
import Companion from './Companion.vue'

const store = useAppStore()
const sound = useSound()
const notif = useNotification()

const { playChime, previewSound, unlockAudio } = sound
const { notifPerm, notifAction, inIframe, requestNotify, notify } = notif

// 番茄结束时的副作用：通知 + 提示音 + 奖励弹层 + 打开复盘 + 后台AI生成道具
function onFocusComplete(minutes: number, isLong: boolean, sessionId: string) {
  if (isLong) {
    notify('🍅 专注完成！', `已完成 ${store.pomoCycle} 个番茄，享受一次长休息吧~`)
  } else {
    notify('🍅 专注完成！', `本番茄专注 ${minutes} 分钟，起来休息一下吧~`)
  }
  playChime()
  showReward(minutes)
  openReflection(sessionId)
  // 后台静默生成AI道具，用户无感，生成成功后自动入库存并追加显示
  generateAiItemBackground()
}

// 后台AI生成道具：失败静默，成功后追加到奖励弹层
async function generateAiItemBackground() {
  try {
    const item = await store.generateAiItemAction()
    if (item) {
      // 追加显示AI道具
      reward.value = {
        gift: item.emoji,
        coins: 0,
        aiItem: item.name,
        aiRarity: item.rarity
      }
      clearTimers()
      rewardTimer = setTimeout(() => (reward.value = null), 5000)
    }
  } catch {
    // 静默失败，不影响用户体验
  }
}
function onBreakComplete() {
  notify('☕ 休息结束', '休息结束，开始下一个番茄吧！')
  playChime()
}

// ---------- 陪伴角色 + 奖励循环 ----------
const reward = ref<{ gift: string; coins: number; aiItem?: string; aiRarity?: string } | null>(null)
const missMsg = ref<string | null>(null)
const tendMsg = ref<string | null>(null)
let rewardTimer: ReturnType<typeof setTimeout> | null = null
let missTimer: ReturnType<typeof setTimeout> | null = null
let tendTimer: ReturnType<typeof setTimeout> | null = null

const DEFAULT_COMPLETE = '🍅 专注完成！小园又长高了一点~'
const DEFAULT_FAIL = '这次小苗渴了，下次再陪它专注吧'

function clearTimers() {
  if (rewardTimer) clearTimeout(rewardTimer)
  if (missTimer) clearTimeout(missTimer)
  if (tendTimer) clearTimeout(tendTimer)
  rewardTimer = missTimer = tendTimer = null
}

// 专注完成：弹奖励（随机礼物 + 专注露珠）。礼物仅作惊喜展示，币值已在 store.recordFocus 中入账
function showReward(minutes: number) {
  const gift = FOCUS_GIFTS[Math.floor(Math.random() * FOCUS_GIFTS.length)]
  reward.value = { gift, coins: focusCoins(minutes) }
  clearTimers()
  rewardTimer = setTimeout(() => (reward.value = null), 4500)
}
function showMiss() {
  missMsg.value = store.companion.failMsg || DEFAULT_FAIL
  clearTimers()
  missTimer = setTimeout(() => (missMsg.value = null), 4000)
}
function onTend() {
  const ok = store.tendCompanion()
  clearTimers()
  if (ok) {
    tendMsg.value = '💧 浇水成功！小绿很开心~'
    // 触发开心状态：展示水滴粒子效果
    reward.value = { gift: '💧', coins: 0 }
    rewardTimer = setTimeout(() => (reward.value = null), 1500)
  } else {
    tendMsg.value = '💧 露珠不足，完成专注获取更多露珠吧'
  }
  tendTimer = setTimeout(() => (tendMsg.value = null), ok ? 1800 : 2500)
}

/** 放弃当前专注（仅在专注进行中点击重置才算“提前退出”，给温和提示；暂停后重置不算） */
function onReset() {
  if (running.value && mode.value === 'focus') showMiss()
  reset()
}

const companionMood = computed<'idle' | 'focusing' | 'happy' | 'sad'>(() => {
  if (reward.value) return 'happy'
  if (missMsg.value) return 'sad'
  if (running.value && mode.value === 'focus') return 'focusing'
  return 'idle'
})
const celebrationChar = computed(() => getCelebration(store.companion.activeCelebration).particle)

// ---------- 专注意图 + 复盘 ----------
const intention = ref('')
const reflectId = ref<string | null>(null)
const reflectRating = ref(0)
const reflectNote = ref('')
const reflectIntention = ref('')

function handleStart() {
  unlockAudio()
  if (store.settings.notify && notifPerm.value === 'default') requestNotify()
  start(intention.value)
  intention.value = '' // 意图已随会话记录，清空输入避免带到下一轮
}

function openReflection(sessionId: string) {
  const s = store.sessions.find((x) => x.id === sessionId)
  if (!s) return
  reflectId.value = sessionId
  reflectRating.value = s.rating || 0
  reflectNote.value = s.note || ''
  reflectIntention.value = s.intention || ''
}
function setRating(n: number) {
  reflectRating.value = n
}
function saveReflection() {
  if (!reflectId.value) return
  store.reflect(reflectId.value, reflectRating.value, reflectNote.value)
  reflectId.value = null
}
function skipReflection() {
  reflectId.value = null
}

const { mode, running, display, progress, cycleInfo, start, pause, reset, switchMode } = useTimer({
  onFocusComplete,
  onBreakComplete
})

// 键盘快捷键：空格 开始/暂停，R 重置（输入控件聚焦时不触发）
function onKey(e: KeyboardEvent) {
  const target = e.target as HTMLElement | null
  const tag = (target && target.tagName ? target.tagName : '').toLowerCase()
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return
  if (e.metaKey || e.ctrlKey || e.altKey) return
  if (e.code === 'Space') {
    e.preventDefault()
    if (running.value) pause()
    else handleStart()
  } else if (e.key === 'r' || e.key === 'R') {
    reset()
  }
}
onMounted(() => window.addEventListener('keydown', onKey))
onUnmounted(() => {
  window.removeEventListener('keydown', onKey)
  clearTimers()
})

const R = 120
const C = 2 * Math.PI * R

// 提示音试听反馈：{ type: 'ok' | 'err', text }
const soundMsg = ref<{ type: 'ok' | 'err'; text: string } | null>(null)
let soundMsgTimer: ReturnType<typeof setTimeout> | null = null
async function testSound() {
  const ok = await previewSound(store.settings.soundType)
  soundMsg.value = ok
    ? {
        type: 'ok',
        text: '✅ 提示音已播放——若没听到，请检查系统音量、输出设备，或标签页是否被静音'
      }
    : {
        type: 'err',
        text: inIframe
          ? '❌ 音频被预览窗口拦截（浏览器限制），请在独立浏览器窗口中试听'
          : '❌ 音频未能播放，请检查系统音量与输出设备'
      }
  if (soundMsgTimer) clearTimeout(soundMsgTimer)
  soundMsgTimer = setTimeout(() => (soundMsg.value = null), 6000)
}

// 通知状态提示：平时引导，点击「开启通知」后给出明确的成功/失败反馈
const notifyHint = computed(() => {
  if (!store.settings.notify) return null
  const a = notifAction.value
  if (a === 'pending') {
    return {
      cls: 'muted',
      text: inIframe
        ? '正在申请权限…预览窗口通常会拦截此请求，稍等片刻会给出解决办法'
        : '正在向浏览器申请权限，请在地址栏附近弹出的询问框中确认…'
    }
  }
  if (notifPerm.value === 'granted') return { cls: 'ok', text: '✅ 桌面通知已开启' }
  if (notifPerm.value === 'unsupported') {
    return { cls: 'err', text: '当前浏览器不支持桌面通知' }
  }
  if (notifPerm.value === 'denied') {
    return inIframe
      ? {
          cls: 'err',
          text: '❌ 申请被拒：嵌入预览窗口中浏览器会拦截通知权限。请点击下方按钮在独立浏览器窗口打开后再点「开启通知」'
        }
      : {
          cls: 'err',
          text: '❌ 已被浏览器拒绝：点击地址栏左侧的 🔒/铃铛图标，把通知设为「允许」后再点「开启通知」'
        }
  }
  if (a === 'error') {
    return {
      cls: 'err',
      text: '❌ 权限申请失败：当前环境可能不允许申请通知，请在独立浏览器窗口中打开本页重试'
    }
  }
  if (a === 'timeout') {
    return {
      cls: 'err',
      text: inIframe
        ? '❌ 申请无响应：预览窗口拦截了通知权限（浏览器不会弹出询问框）。请点击下方按钮在独立窗口打开，再点「开启通知」'
        : '❌ 申请超时无响应：若没看到询问弹窗，说明环境拦截了申请，请更换 Chrome / Edge 后重试；若弹窗仍在显示，直接选择即可'
    }
  }
  if (a === 'dismissed') {
    return { cls: 'err', text: '弹窗未做选择，可再次点击「开启通知」' }
  }
  return inIframe
    ? {
        cls: 'muted',
        text: '💡 嵌入预览窗口中浏览器通常会拦截通知权限，建议在独立浏览器窗口中使用'
      }
    : { cls: 'muted', text: '尚未授权，点击「开启通知」并在弹窗中允许，番茄结束即可收到桌面提醒' }
})

// 在预览面板中被拦截时，提供一键在独立窗口打开的出口
const showStandaloneBtn = computed(
  () =>
    store.settings.notify &&
    inIframe &&
    (notifPerm.value === 'denied' || notifAction.value === 'timeout')
)

function openStandalone() {
  window.open(window.location.href, '_blank')
}
</script>

<template>
  <section class="card timer">
    <h2>🍅 番茄钟</h2>

    <div class="modes">
      <button :class="['mode', { active: mode === 'focus' }]" @click="switchMode('focus')">
        专注
      </button>
      <button :class="['mode', { active: mode === 'break' }]" @click="switchMode('break')">
        短休
      </button>
      <button :class="['mode', { active: mode === 'long' }]" @click="switchMode('long')">
        长休
      </button>
    </div>

    <div v-if="mode === 'focus' && !running" class="intention">
      <input
        v-model="intention"
        type="text"
        placeholder="本次专注意图（可选），如「写完引言」"
        maxlength="60"
        @keyup.enter="handleStart"
      />
    </div>

    <div class="companion-area">
      <Companion
        :mood="companionMood"
        :skin-id="store.companion.activeCompanion"
        :stage="plantStage(store.pomoCycle)"
        :celebration="celebrationChar"
        :name="store.companion.name"
        @tend="onTend"
      />
      <div class="coin-badge" title="专注露珠，完成专注获得">💧 {{ store.companion.coins }}</div>
    </div>

    <transition name="fade">
      <div v-if="reward" class="reward-pop" role="status">
        <div class="reward-gift">{{ reward.gift }}</div>
        <div v-if="reward.aiItem" class="reward-ai-item">
          <span class="ai-label">✨ AI 生成道具</span>
          <span class="ai-name">{{ reward.aiItem }}</span>
          <span class="ai-rarity" :class="'rarity-' + (reward.aiRarity || 'common')">
            {{ reward.aiRarity === 'legendary' ? '传说' : reward.aiRarity === 'rare' ? '稀有' : '普通' }}
          </span>
        </div>
        <div v-else class="reward-text">{{ store.companion.completeMsg || DEFAULT_COMPLETE }}</div>
        <div v-if="reward.coins > 0" class="reward-coins">+{{ reward.coins }} 💧</div>
      </div>
    </transition>

    <div v-if="missMsg" class="miss-hint" role="status">{{ missMsg }}</div>
    <div v-if="tendMsg" class="tend-hint">{{ tendMsg }}</div>

    <div class="ring-wrap">
      <svg class="ring" viewBox="0 0 280 280">
        <defs>
          <linearGradient id="grad-focus" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#5b6cff" />
            <stop offset="100%" stop-color="#8b5cf6" />
          </linearGradient>
          <linearGradient id="grad-break" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#2bbf8a" />
            <stop offset="100%" stop-color="#1fb6d6" />
          </linearGradient>
          <linearGradient id="grad-long" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#ffae42" />
            <stop offset="100%" stop-color="#ff6b6b" />
          </linearGradient>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <!-- 背景环 -->
        <circle class="ring-bg" cx="140" cy="140" :r="R" />
        <!-- 进度环发光层 -->
        <circle
          v-if="progress > 0"
          class="ring-glow"
          cx="140"
          cy="140"
          :r="R"
          :stroke="`url(#grad-${mode})`"
          :stroke-dasharray="C"
          :stroke-dashoffset="C * (1 - progress)"
          filter="url(#glow)"
        />
        <!-- 进度环主层 -->
        <circle
          class="ring-fg"
          cx="140"
          cy="140"
          :r="R"
          :stroke="`url(#grad-${mode})`"
          :stroke-dasharray="C"
          :stroke-dashoffset="C * (1 - progress)"
        />
      </svg>
      <div class="ring-center">
        <div class="time" :class="`time-${mode}`">{{ display }}</div>
        <div class="state-label muted">
          {{ mode === 'focus' ? '专注中' : mode === 'long' ? '长休息中' : '休息中' }}
        </div>
        <div v-if="mode === 'focus'" class="cycle muted">
          第 {{ cycleInfo.done + 1 }}/{{ cycleInfo.interval }} 个番茄
        </div>
      </div>
    </div>

    <div class="controls">
      <button v-if="!running" class="btn primary" @click="handleStart">开始</button>
      <button v-else class="btn" @click="pause">暂停</button>
      <button class="btn ghost" @click="onReset">重置</button>
    </div>

    <div v-if="reflectId" class="reflect">
      <div class="reflect-title">📝 复盘这一番茄</div>
      <p v-if="reflectIntention" class="reflect-intent">意图：{{ reflectIntention }}</p>
      <div class="stars">
        <button
          v-for="n in 5"
          :key="n"
          type="button"
          class="star"
          :class="{ on: n <= reflectRating }"
          @click="setRating(n)"
        >
          ★
        </button>
        <span class="muted">{{ reflectRating ? reflectRating + ' 分' : '未评分' }}</span>
      </div>
      <textarea
        v-model="reflectNote"
        class="reflect-note"
        placeholder="记录这次专注的感受、卡点、下一步…"
        maxlength="300"
      />
      <div class="reflect-actions">
        <button class="btn primary sm" @click="saveReflection">保存</button>
        <button class="btn ghost sm" @click="skipReflection">跳过</button>
      </div>
    </div>

    <div class="switches">
      <label class="switch">
        <input v-model="store.settings.notify" type="checkbox" />
        <span>桌面通知</span>
      </label>
      <label class="switch">
        <input v-model="store.settings.sound" type="checkbox" />
        <span>提示音</span>
      </label>
      <select v-if="store.settings.sound" v-model="store.settings.soundType" class="sound-select">
        <option v-for="o in SOUND_OPTIONS" :key="o.value" :value="o.value">
          {{ o.label }}
        </option>
      </select>
      <button v-if="store.settings.sound" class="btn small" @click="testSound">试听</button>
      <button
        v-if="store.settings.notify && notifPerm === 'default'"
        class="btn small"
        :disabled="notifAction === 'pending'"
        @click="requestNotify"
      >
        {{ notifAction === 'pending' ? '申请中…' : '开启通知' }}
      </button>
    </div>
    <p v-if="soundMsg" class="perm-hint" :class="soundMsg.type">
      {{ soundMsg.text }}
    </p>
    <p v-if="notifyHint" class="perm-hint" :class="notifyHint.cls">
      {{ notifyHint.text }}
      <button v-if="showStandaloneBtn" class="btn small standalone" @click="openStandalone">
        ↗ 在独立窗口打开
      </button>
    </p>

    <TimerSettings />

    <p class="shortcut-hint muted">快捷键：空格 开始/暂停 · R 重置</p>
  </section>
</template>

<style scoped>
.timer {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}
.modes {
  display: flex;
  gap: 6px;
  margin-bottom: 14px;
  background: var(--accent-soft);
  padding: 4px;
  border-radius: 999px;
}
.mode {
  padding: 7px 20px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 600;
  color: var(--muted);
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
.mode.active {
  background: var(--card);
  color: var(--accent);
  box-shadow: var(--shadow-sm);
}
.mode:hover:not(.active) {
  color: var(--text);
}
.ring-wrap {
  position: relative;
  width: 260px;
  height: 260px;
  margin: 8px 0;
}
.ring {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}
.ring-bg {
  fill: none;
  stroke: var(--border);
  stroke-width: 12;
  opacity: 0.6;
}
.ring-glow {
  fill: none;
  stroke-width: 12;
  stroke-linecap: round;
  opacity: 0.5;
  transition: stroke-dashoffset 0.4s linear;
}
.ring-fg {
  fill: none;
  stroke-width: 12;
  stroke-linecap: round;
  transition: stroke-dashoffset 0.4s linear;
}
.ring-center {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.time {
  font-size: 52px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  letter-spacing: -1px;
  line-height: 1;
  background: var(--accent-gradient);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}
.time-break {
  background: linear-gradient(135deg, #2bbf8a 0%, #1fb6d6 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}
.time-long {
  background: linear-gradient(135deg, #ffae42 0%, #ff6b6b 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}
.state-label {
  font-size: 14px;
  margin-top: 8px;
  font-weight: 500;
}
.cycle {
  font-size: 12px;
  margin-top: 4px;
  letter-spacing: 0.5px;
}
.controls {
  display: flex;
  gap: 10px;
  margin: 18px 0 6px;
}
.switches {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 13px;
  color: var(--muted);
  margin-top: 4px;
}
.switch {
  display: flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
}
.btn.small {
  padding: 3px 10px;
  font-size: 12px;
}
.perm-hint {
  font-size: 12px;
  margin: 6px 0 0;
  max-width: 280px;
  text-align: center;
  color: var(--muted);
  line-height: 1.6;
}
.perm-hint.ok {
  color: var(--good);
}
.perm-hint.err {
  color: var(--warn);
}
.perm-hint .standalone {
  display: block;
  margin: 8px auto 0;
}
.sound-select {
  font-size: 12px;
  padding: 3px 8px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--card);
  color: var(--text);
  margin-left: -4px;
}
.shortcut-hint {
  font-size: 12px;
  margin: 12px 0 0;
}
.intention {
  width: 100%;
  margin-bottom: 8px;
}
.intention input {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid var(--border);
  border-radius: 10px;
  font-size: 13px;
  text-align: center;
}
.reflect {
  width: 100%;
  margin-top: 14px;
  padding: 16px;
  border: 1px solid rgba(91, 108, 255, 0.15);
  border-radius: var(--radius);
  background: linear-gradient(135deg, var(--card), var(--accent-soft));
  text-align: left;
  box-shadow: var(--shadow);
  animation: reflectIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes reflectIn {
  from { opacity: 0; transform: translateY(10px) scale(0.97); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
.reflect-title {
  font-size: 14px;
  font-weight: 700;
  margin-bottom: 8px;
  background: var(--accent-gradient);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}
.reflect-intent {
  font-size: 12px;
  color: var(--muted);
  margin: 0 0 10px;
  padding: 6px 10px;
  background: var(--card);
  border-radius: 8px;
  border-left: 3px solid var(--accent);
}
.stars {
  display: flex;
  align-items: center;
  gap: 2px;
  margin-bottom: 10px;
}
.star {
  font-size: 24px;
  line-height: 1;
  background: none;
  border: none;
  color: var(--border);
  cursor: pointer;
  padding: 0 3px;
  transition: all 0.15s ease;
}
.star:hover {
  transform: scale(1.2);
}
.star.on {
  color: #f5a623;
  text-shadow: 0 0 10px rgba(245, 166, 35, 0.5);
}
.reflect-note {
  width: 100%;
  min-height: 60px;
  resize: vertical;
  padding: 10px 12px;
  border: 1.5px solid var(--border);
  border-radius: var(--radius-sm);
  font-size: 13px;
  font-family: inherit;
  background: var(--card);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.reflect-note:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(91, 108, 255, 0.1);
  outline: none;
}
.reflect-actions {
  display: flex;
  gap: 8px;
  margin-top: 10px;
}
.btn.sm {
  padding: 6px 14px;
  font-size: 12px;
}
.companion-area {
  position: relative;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  margin: 2px 0 4px;
}
.coin-badge {
  position: absolute;
  right: 0;
  top: 6px;
  font-size: 13px;
  font-weight: 700;
  padding: 5px 12px;
  border-radius: 999px;
  background: linear-gradient(135deg, rgba(91, 108, 255, 0.1), rgba(139, 92, 246, 0.08));
  color: var(--accent);
  border: 1px solid rgba(91, 108, 255, 0.15);
  box-shadow: var(--shadow-sm);
}
.reward-pop {
  position: absolute;
  top: 70px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 5;
  width: 230px;
  padding: 18px 16px;
  border-radius: var(--radius);
  background: linear-gradient(135deg, var(--card) 0%, var(--accent-soft) 100%);
  border: 1px solid rgba(91, 108, 255, 0.2);
  box-shadow: 0 12px 40px rgba(91, 108, 255, 0.2), var(--shadow);
  text-align: center;
  animation: pop-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes pop-in {
  0% {
    transform: translateX(-50%) scale(0.7);
    opacity: 0;
  }
  60% {
    transform: translateX(-50%) scale(1.05);
  }
  100% {
    transform: translateX(-50%) scale(1);
    opacity: 1;
  }
}
.reward-gift {
  font-size: 44px;
  line-height: 1;
  margin-bottom: 8px;
  animation: giftBounce 0.6s ease 0.2s both;
}
@keyframes giftBounce {
  0% { transform: scale(0) rotate(-20deg); }
  60% { transform: scale(1.2) rotate(5deg); }
  100% { transform: scale(1) rotate(0); }
}
.reward-text {
  font-size: 13px;
  color: var(--text);
  line-height: 1.5;
  font-weight: 500;
}
.reward-coins {
  margin-top: 8px;
  font-size: 15px;
  font-weight: 800;
  background: var(--accent-gradient);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}
.reward-ai-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  margin-top: 4px;
}
.ai-label {
  font-size: 10px;
  color: var(--muted);
  font-weight: 600;
  letter-spacing: 0.5px;
}
.ai-name {
  font-size: 16px;
  font-weight: 800;
  color: var(--text);
}
.ai-rarity {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 999px;
  color: white;
}
.ai-rarity.rarity-common { background: #2bbf8a; }
.ai-rarity.rarity-rare { background: #9b6bff; }
.ai-rarity.rarity-legendary { background: linear-gradient(135deg, #FFD700, #FFA500); }
.miss-hint {
  margin: 6px 0 0;
  font-size: 12px;
  color: var(--muted);
  text-align: center;
  max-width: 260px;
}
.tend-hint {
  margin: 4px 0 0;
  font-size: 12px;
  color: var(--accent);
  text-align: center;
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
@media (prefers-reduced-motion: reduce) {
  .reward-pop {
    animation: none;
  }
}
</style>
