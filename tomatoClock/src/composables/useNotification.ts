import { ref } from 'vue'
import { useAppStore } from '@/stores/useAppStore'

export type NotifPerm = 'granted' | 'denied' | 'default' | 'unsupported'
export type NotifAction =
  null | 'pending' | 'granted' | 'denied' | 'dismissed' | 'error' | 'timeout' | 'unsupported'

/** 桌面通知：权限申请（带看门狗超时）+ 通知发送 */
export function useNotification() {
  const store = useAppStore()

  const notifPerm = ref<NotifPerm>(
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
  )
  const notifAction = ref<NotifAction>(null)

  // 是否运行在嵌入 iframe 中（预览面板等场景浏览器会拦截通知权限申请）
  const inIframe = typeof window !== 'undefined' && window.self !== window.top

  function notify(title: string, body: string) {
    if (!store.settings.notify) return
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return
    try {
      const n = new Notification(title, { body, silent: true, tag: 'pomodoro' })
      // 点击通知：把应用窗口/标签页带到前台
      n.onclick = () => {
        try {
          window.focus()
          if (window.self !== window.top) window.top?.focus()
        } catch {
          /* 跨域受限时忽略 */
        }
        n.close()
      }
      setTimeout(() => n.close(), 8000)
    } catch {
      /* 某些环境（如不安全的 iframe）不支持构造 Notification */
    }
  }

  function requestNotify(): Promise<NotifPerm> {
    if (typeof Notification === 'undefined') {
      notifPerm.value = 'unsupported'
      notifAction.value = 'unsupported'
      return Promise.resolve('unsupported')
    }
    notifAction.value = 'pending'
    return new Promise((resolve) => {
      let done = false

      // 看门狗：被拦截的环境（如 iframe 预览面板）里 requestPermission 的
      // Promise 可能永远不落定，超时后给出明确提示而不是一直停在「申请中」。
      const watchdog = setTimeout(() => {
        if (done) return
        notifAction.value = 'timeout'
        resolve('default')
      }, 5000)

      const settle = (p: NotificationPermission) => {
        if (done) return
        done = true
        clearTimeout(watchdog)
        notifPerm.value = p
        notifAction.value = p === 'granted' ? 'granted' : p === 'denied' ? 'denied' : 'dismissed'
        if (p === 'granted') {
          notify('✅ 桌面通知已开启', '番茄结束时会在系统右下角弹窗提醒你')
        }
        resolve(p)
      }

      try {
        // 现代浏览器返回 Promise；旧 Safari 只支持回调形式
        const r = Notification.requestPermission(settle) as unknown as
          Promise<NotificationPermission> | undefined
        if (r && typeof r.then === 'function') {
          r.then(settle).catch(() => {
            if (done) return
            done = true
            clearTimeout(watchdog)
            notifPerm.value = 'denied'
            notifAction.value = 'error'
            resolve('denied')
          })
        }
      } catch {
        if (!done) {
          done = true
          clearTimeout(watchdog)
          notifPerm.value = 'denied'
          notifAction.value = 'error'
          resolve('denied')
        }
      }
    })
  }

  return { notifPerm, notifAction, inIframe, requestNotify, notify }
}
