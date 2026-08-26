import { ref, computed, watch, onUnmounted } from "vue"
import { useStore } from "../store/useStore"

// 模块级共享：AudioContext 在用户手势时创建/恢复，番茄结束时直接播放
let audioCtx = null

export function usePomodoro() {
  const { state, uid } = useStore()

  const mode = ref("focus") // 'focus' | 'break'
  const running = ref(false)
  const remaining = ref(state.settings.focusMin * 60)
  let timer = null

  // 当前通知权限状态：'granted' | 'denied' | 'default' | 'unsupported'
  const notifPerm = ref(
    typeof Notification !== "undefined" ? Notification.permission : "unsupported"
  )

  // 权限申请动作的即时状态（用于 UI 反馈）：
  // null=未操作 | 'pending' | 'granted' | 'denied' | 'dismissed' | 'error' | 'unsupported'
  const notifAction = ref(null)

  // 是否运行在嵌入 iframe 中（预览面板等场景浏览器会拦截通知权限申请）
  const inIframe = typeof window !== "undefined" && window.self !== window.top

  const totalSeconds = computed(
    () =>
      (mode.value === "focus"
        ? state.settings.focusMin
        : state.settings.breakMin) * 60
  )

  const progress = computed(() => {
    const t = totalSeconds.value
    return t > 0 ? 1 - remaining.value / t : 0
  })

  const display = computed(() => {
    const m = String(Math.floor(remaining.value / 60)).padStart(2, "0")
    const s = String(remaining.value % 60).padStart(2, "0")
    return `${m}:${s}`
  })

  // ---------- 提示音（WebAudio 生成，无需音频文件） ----------
  function ensureAudio() {
    try {
      if (!audioCtx) {
        const Ctx = window.AudioContext || window.webkitAudioContext
        if (!Ctx) return
        audioCtx = new Ctx()
      }
      if (audioCtx.state === "suspended") audioCtx.resume()
    } catch (e) {
      /* 音频不可用时静默降级 */
    }
  }

  function playChime() {
    if (!state.settings.sound) return
    ensureAudio()
    if (!audioCtx || audioCtx.state !== "running") return
    try {
      const now = audioCtx.currentTime
      // 两个柔和的双音提示
      ;[880, 1174.7].forEach((freq, i) => {
        const osc = audioCtx.createOscillator()
        const gain = audioCtx.createGain()
        osc.type = "sine"
        osc.frequency.value = freq
        osc.connect(gain)
        gain.connect(audioCtx.destination)
        const t = now + i * 0.18
        gain.gain.setValueAtTime(0, t)
        gain.gain.linearRampToValueAtTime(0.3, t + 0.02)
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.4)
        osc.start(t)
        osc.stop(t + 0.45)
      })
    } catch (e) {
      /* 播放失败不影响主流程 */
    }
  }

  // ---------- 桌面通知 ----------
  function requestNotify() {
    if (typeof Notification === "undefined") {
      notifPerm.value = "unsupported"
      notifAction.value = "unsupported"
      return Promise.resolve("unsupported")
    }
    notifAction.value = "pending"
    return new Promise((resolve) => {
      let done = false

      // 看门狗：被拦截的环境（如 iframe 预览面板）里 requestPermission 的
      // Promise 可能永远不落定（不弹窗、无回调、无异常），超时后给出明确
      // 提示而不是一直停在「申请中」。权限本身仍是 default，可稍后重试；
      // 若用户在弹窗上晚一点做出选择，settle 仍会正常接管并更新状态。
      const watchdog = setTimeout(() => {
        if (done) return
        notifAction.value = "timeout"
        resolve("default")
      }, 5000)

      const settle = (p) => {
        if (done) return
        done = true
        clearTimeout(watchdog)
        notifPerm.value = p
        notifAction.value =
          p === "granted" ? "granted" : p === "denied" ? "denied" : "dismissed"
        if (p === "granted") {
          // 立即发一条测试通知，让用户直观确认通道可用
          notify("✅ 桌面通知已开启", "番茄结束时会在系统右下角弹窗提醒你")
        }
        resolve(p)
      }

      try {
        // 现代浏览器返回 Promise；旧 Safari 只支持回调形式
        const r = Notification.requestPermission(settle)
        if (r && typeof r.then === "function") {
          r.then(settle).catch(() => {
            if (done) return
            done = true
            clearTimeout(watchdog)
            notifPerm.value = "denied"
            notifAction.value = "error"
            resolve("denied")
          })
        }
      } catch (e) {
        // 某些嵌入环境（iframe/权限策略）会直接抛错
        if (!done) {
          done = true
          clearTimeout(watchdog)
          notifPerm.value = "denied"
          notifAction.value = "error"
          resolve("denied")
        }
      }
    })
  }

  function notify(title, body) {
    if (!state.settings.notify) return
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return
    try {
      const n = new Notification(title, { body, silent: true, tag: "pomodoro" })
      // 点击通知：把应用窗口/标签页带到前台
      n.onclick = () => {
        try {
          window.focus()
          // 若运行在 iframe 中（如预览面板），把顶层窗口也带到前台
          if (window.self !== window.top) window.top.focus()
        } catch (e) {
          /* 跨域受限时忽略 */
        }
        n.close()
      }
      setTimeout(() => n.close(), 8000)
    } catch (e) {
      /* 某些环境（如不安全的 iframe）不支持构造 Notification */
    }
  }

  // ---------- 计时核心 ----------
  function tick() {
    if (remaining.value > 0) {
      remaining.value--
      if (remaining.value === 0) complete()
    }
  }

  function start() {
    ensureAudio() // 借助用户手势激活音频
    if (running.value) return
    running.value = true
    timer = setInterval(tick, 1000)
    // 首次开始时顺带申请通知权限（此时用户已产生交互，权限弹窗合法）
    if (state.settings.notify && notifPerm.value === "default") requestNotify()
  }

  function pause() {
    running.value = false
    if (timer) clearInterval(timer)
    timer = null
  }

  function reset() {
    pause()
    remaining.value = totalSeconds.value
  }

  function switchMode(m) {
    mode.value = m
    pause()
    remaining.value = totalSeconds.value
  }

  function complete() {
    pause()
    if (mode.value === "focus") {
      const minutes = state.settings.focusMin
      state.sessions.push({ id: uid(), minutes, ts: Date.now() })
      notify("🍅 专注完成！", `本番茄专注 ${minutes} 分钟，起来休息一下吧~`)
      mode.value = "break"
    } else {
      notify("☕ 休息结束", "休息结束，开始下一个番茄吧！")
      mode.value = "focus"
    }
    playChime()
    remaining.value = totalSeconds.value
  }

  // 设置变更时（且未在计时）同步刷新剩余时间
  watch(
    () => [state.settings.focusMin, state.settings.breakMin, mode.value],
    () => {
      if (!running.value) remaining.value = totalSeconds.value
    }
  )

  // ---------- 标签页标题倒计时 ----------
  // 运行/暂停中把剩余时间写进 document.title，切到别的标签页也能瞄一眼进度
  const BASE_TITLE = typeof document !== "undefined" ? document.title : ""
  const idle = computed(() => !running.value && remaining.value === totalSeconds.value)

  watch([display, mode, idle, running], () => {
    if (typeof document === "undefined") return
    if (idle.value) {
      document.title = BASE_TITLE
      return
    }
    const icon = mode.value === "focus" ? "🍅" : "☕"
    const label = mode.value === "focus" ? "专注中" : "休息中"
    document.title = running.value
      ? `${icon} ${display.value} ${label}`
      : `${icon} ${display.value} 已暂停`
  })

  function restoreTitle() {
    if (typeof document !== "undefined") document.title = BASE_TITLE
  }

  onUnmounted(() => {
    if (timer) clearInterval(timer)
    restoreTitle()
  })

  return {
    mode,
    running,
    remaining,
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
    ensureAudio
  }
}
