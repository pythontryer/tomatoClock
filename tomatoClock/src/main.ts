import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { useAppStore } from '@/stores/useAppStore'
import { saveState } from '@/stores/persistence'
import './style.css'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)

// 状态自动持久化：任意深层变更都写入 localStorage
const store = useAppStore(pinia)
store.$subscribe((_mutation, state) => {
  saveState(state)
}, { deep: true })

app.mount('#app')

// 仅在生产构建注册 Service Worker（避免干扰 dev 的热更新）
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {})
  })
}
