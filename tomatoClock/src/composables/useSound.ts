import { onUnmounted } from 'vue'
import { useAppStore } from '@/stores/useAppStore'
import { SOUND_PROFILES, type SoundProfile } from '@/constants'
import type { SoundType } from '@/types/models'

// 模块级共享：AudioContext 在用户手势时创建/恢复，番茄结束时直接播放
let audioCtx: AudioContext | null = null

/** WebAudio 提示音合成（无需音频文件） */
export function useSound() {
  const store = useAppStore()

  async function ensureAudio(): Promise<AudioContext | null> {
    try {
      if (!audioCtx) {
        const Ctx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
        if (!Ctx) return null
        audioCtx = new Ctx()
      }
      // resume() 是异步的，必须等它完成再判断状态，否则会误判为未激活而静音放弃
      if (audioCtx.state === 'suspended') {
        await audioCtx.resume()
      }
    } catch {
      /* 音频不可用时静默降级 */
    }
    return audioCtx
  }

  // 按 profile 在 ctx 上调度音符序列（可指定整体起始偏移，便于连续播放）
  function scheduleProfile(ctx: AudioContext, profile: SoundProfile, startOffset = 0) {
    const now = ctx.currentTime + startOffset
    profile.notes.forEach((note) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = profile.type
      osc.frequency.value = note.freq
      osc.connect(gain)
      gain.connect(ctx.destination)
      const t = now + note.offset
      gain.gain.setValueAtTime(0, t)
      gain.gain.linearRampToValueAtTime(profile.peak, t + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, t + note.duration)
      osc.start(t)
      osc.stop(t + note.duration + 0.05)
    })
  }

  async function playChime(): Promise<boolean> {
    if (!store.settings.sound) return false
    const ctx = await ensureAudio()
    if (!ctx || ctx.state !== 'running') return false
    try {
      const profile = SOUND_PROFILES[store.settings.soundType] ?? SOUND_PROFILES.chime
      scheduleProfile(ctx, profile)
      return true
    } catch {
      return false
    }
  }

  /** 设置面板「试听」用：播放指定类型，不受 sound 开关限制 */
  async function previewSound(type: SoundType): Promise<boolean> {
    const ctx = await ensureAudio()
    if (!ctx || ctx.state !== 'running') return false
    try {
      const profile = SOUND_PROFILES[type] ?? SOUND_PROFILES.chime
      scheduleProfile(ctx, profile)
      return true
    } catch {
      return false
    }
  }

  // 音频解锁：浏览器要求 AudioContext 在用户手势中创建/恢复。
  // 除「开始」按钮外，任意首次交互（点击/按键）都尝试解锁，成功后移除监听。
  function unlockAudio() {
    ensureAudio().then((ctx) => {
      if (ctx && ctx.state === 'running') {
        window.removeEventListener('pointerdown', unlockAudio)
        window.removeEventListener('keydown', unlockAudio)
      }
    })
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('pointerdown', unlockAudio)
    window.addEventListener('keydown', unlockAudio)
  }

  onUnmounted(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('pointerdown', unlockAudio)
      window.removeEventListener('keydown', unlockAudio)
    }
  })

  return { ensureAudio, playChime, previewSound, unlockAudio }
}
