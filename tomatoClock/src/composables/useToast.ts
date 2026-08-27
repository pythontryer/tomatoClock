import { ref } from 'vue'

export type ToastType = 'info' | 'good' | 'warn'

export interface Toast {
  id: number
  text: string
  type: ToastType
}

// 模块级单例，App 内的任意位置都能 push，由 <ToastHost> 统一渲染
const toasts = ref<Toast[]>([])
let seq = 0

export function pushToast(text: string, type: ToastType = 'info', ttl = 6000) {
  const id = ++seq
  toasts.value.push({ id, text, type })
  setTimeout(() => {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }, ttl)
}

export function useToasts() {
  return { toasts, pushToast }
}
