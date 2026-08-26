<script setup>
import { computed, ref } from "vue"
import { usePomodoro } from "../composables/usePomodoro"
import { useStore } from "../store/useStore"

const {
  mode,
  running,
  display,
  progress,
  notifPerm,
  notifAction,
  inIframe,
  start,
  pause,
  reset,
  switchMode,
  requestNotify,
  playChime
} = usePomodoro()
const { state } = useStore()

const R = 120
const C = 2 * Math.PI * R

// 提示音试听反馈：{ type: 'ok' | 'err', text }
const soundMsg = ref(null)
let soundMsgTimer = null
async function testSound() {
  const ok = await playChime()
  soundMsg.value = ok
    ? { type: "ok", text: "✅ 提示音已播放——若没听到，请检查系统音量、输出设备，或标签页是否被静音" }
    : {
        type: "err",
        text: inIframe
          ? "❌ 音频被预览窗口拦截（浏览器限制），请在独立浏览器窗口中试听"
          : "❌ 音频未能播放，请检查系统音量与输出设备"
      }
  clearTimeout(soundMsgTimer)
  soundMsgTimer = setTimeout(() => (soundMsg.value = null), 6000)
}

// 通知状态提示：平时引导，点击「开启通知」后给出明确的成功/失败反馈
const notifyHint = computed(() => {
  if (!state.settings.notify) return null
  const a = notifAction.value
  if (a === "pending") {
    return {
      cls: "muted",
      text: inIframe
        ? "正在申请权限…预览窗口通常会拦截此请求，稍等片刻会给出解决办法"
        : "正在向浏览器申请权限，请在地址栏附近弹出的询问框中确认…"
    }
  }
  if (notifPerm.value === "granted") {
    return { cls: "ok", text: "✅ 桌面通知已开启" }
  }
  if (notifPerm.value === "unsupported") {
    return { cls: "err", text: "当前浏览器不支持桌面通知" }
  }
  if (notifPerm.value === "denied") {
    return inIframe
      ? { cls: "err", text: "❌ 申请被拒：嵌入预览窗口中浏览器会拦截通知权限。请点击下方按钮在独立浏览器窗口打开后再点「开启通知」" }
      : { cls: "err", text: "❌ 已被浏览器拒绝：点击地址栏左侧的 🔒/铃铛图标，把通知设为「允许」后再点「开启通知」" }
  }
  if (a === "error") {
    return { cls: "err", text: "❌ 权限申请失败：当前环境可能不允许申请通知，请在独立浏览器窗口中打开本页重试" }
  }
  if (a === "timeout") {
    return {
      cls: "err",
      text: inIframe
        ? "❌ 申请无响应：预览窗口拦截了通知权限（浏览器不会弹出询问框）。请点击下方按钮在独立窗口打开，再点「开启通知」"
        : "❌ 申请超时无响应：若没看到询问弹窗，说明环境拦截了申请，请更换 Chrome / Edge 后重试；若弹窗仍在显示，直接选择即可"
    }
  }
  if (a === "dismissed") {
    return { cls: "err", text: "弹窗未做选择，可再次点击「开启通知」" }
  }
  // default：还没申请过
  return inIframe
    ? { cls: "muted", text: "💡 嵌入预览窗口中浏览器通常会拦截通知权限，建议在独立浏览器窗口中使用" }
    : { cls: "muted", text: "尚未授权，点击「开启通知」并在弹窗中允许，番茄结束即可收到桌面提醒" }
})

// 在预览面板中被拦截时，提供一键在独立窗口打开的出口
const showStandaloneBtn = computed(
  () =>
    state.settings.notify &&
    inIframe &&
    (notifPerm.value === "denied" || notifAction.value === "timeout")
)

function openStandalone() {
  window.open(window.location.href, "_blank")
}
</script>

<template>
  <section class="card timer">
    <h2>🍅 番茄钟</h2>

    <div class="modes">
      <button
        :class="['mode', { active: mode === 'focus' }]"
        @click="switchMode('focus')"
      >
        专注
      </button>
      <button
        :class="['mode', { active: mode === 'break' }]"
        @click="switchMode('break')"
      >
        休息
      </button>
    </div>

    <div class="ring-wrap">
      <svg class="ring" viewBox="0 0 280 280">
        <circle class="ring-bg" cx="140" cy="140" :r="R" />
        <circle
          class="ring-fg"
          cx="140"
          cy="140"
          :r="R"
          :stroke-dasharray="C"
          :stroke-dashoffset="C * (1 - progress)"
        />
      </svg>
      <div class="ring-center">
        <div class="time">{{ display }}</div>
        <div class="state-label muted">
          {{ mode === "focus" ? "专注中" : "休息中" }}
        </div>
      </div>
    </div>

    <div class="controls">
      <button v-if="!running" class="btn primary" @click="start">开始</button>
      <button v-else class="btn" @click="pause">暂停</button>
      <button class="btn ghost" @click="reset">重置</button>
    </div>

    <div class="switches">
      <label class="switch">
        <input type="checkbox" v-model="state.settings.notify" />
        <span>桌面通知</span>
      </label>
      <label class="switch">
        <input type="checkbox" v-model="state.settings.sound" />
        <span>提示音</span>
      </label>
      <button v-if="state.settings.sound" class="btn small" @click="testSound">
        试听
      </button>
      <button
        v-if="state.settings.notify && notifPerm === 'default'"
        class="btn small"
        :disabled="notifAction === 'pending'"
        @click="requestNotify"
      >
        {{ notifAction === "pending" ? "申请中…" : "开启通知" }}
      </button>
    </div>
    <p v-if="soundMsg" class="perm-hint" :class="soundMsg.type">
      {{ soundMsg.text }}
    </p>
    <p v-if="notifyHint" class="perm-hint" :class="notifyHint.cls">
      {{ notifyHint.text }}
      <button
        v-if="showStandaloneBtn"
        class="btn small standalone"
        @click="openStandalone"
      >
        ↗ 在独立窗口打开
      </button>
    </p>

    <div class="settings">
      <label>
        专注时长
        <input
          type="number"
          min="1"
          max="120"
          v-model.number="state.settings.focusMin"
        />
        分
      </label>
      <label>
        休息时长
        <input
          type="number"
          min="1"
          max="60"
          v-model.number="state.settings.breakMin"
        />
        分
      </label>
    </div>
    <div class="settings">
      <label>
        每日专注目标
        <input
          type="number"
          min="0"
          max="960"
          v-model.number="state.settings.dailyFocusTarget"
        />
        分
      </label>
      <label>
        每日番茄目标
        <input
          type="number"
          min="0"
          max="40"
          v-model.number="state.settings.dailyPomoTarget"
        />
        个
      </label>
    </div>
  </section>
</template>

<style scoped>
.timer {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.modes {
  display: flex;
  gap: 8px;
  margin-bottom: 14px;
}
.mode {
  padding: 6px 18px;
  border-radius: 999px;
  font-size: 13px;
  background: var(--accent-soft);
  color: var(--muted);
}
.mode.active {
  background: var(--accent);
  color: #fff;
}
.ring-wrap {
  position: relative;
  width: 240px;
  height: 240px;
}
.ring {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}
.ring-bg {
  fill: none;
  stroke: var(--border);
  stroke-width: 14;
}
.ring-fg {
  fill: none;
  stroke: var(--accent);
  stroke-width: 14;
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
  font-size: 48px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.state-label {
  font-size: 13px;
  margin-top: 4px;
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
.settings {
  display: flex;
  gap: 18px;
  margin-top: 10px;
  font-size: 13px;
  color: var(--muted);
}
.settings input {
  width: 52px;
  padding: 4px 6px;
  border: 1px solid var(--border);
  border-radius: 8px;
  text-align: center;
  margin: 0 4px;
}
</style>
