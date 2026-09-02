import { createRouter, createWebHashHistory } from 'vue-router'
import FocusView from '@/views/FocusView.vue'
import StatsView from '@/views/StatsView.vue'
import GardenView from '@/views/GardenView.vue'
import SettingsView from '@/views/SettingsView.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'focus', component: FocusView, meta: { title: '专注' } },
    { path: '/stats', name: 'stats', component: StatsView, meta: { title: '统计' } },
    { path: '/garden', name: 'garden', component: GardenView, meta: { title: '小园' } },
    { path: '/settings', name: 'settings', component: SettingsView, meta: { title: '设置' } }
  ]
})

export default router
