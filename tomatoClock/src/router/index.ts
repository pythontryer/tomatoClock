import { createRouter, createWebHashHistory } from 'vue-router'
import FocusView from '@/views/FocusView.vue'
import StatsView from '@/views/StatsView.vue'
import GardenView from '@/views/GardenView.vue'
import SettingsView from '@/views/SettingsView.vue'
import LoginView from '@/views/LoginView.vue'
import RegisterView from '@/views/RegisterView.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'focus', component: FocusView, meta: { title: '专注' } },
    { path: '/stats', name: 'stats', component: StatsView, meta: { title: '统计' } },
    { path: '/garden', name: 'garden', component: GardenView, meta: { title: '小园' } },
    { path: '/settings', name: 'settings', component: SettingsView, meta: { title: '设置' } },
    { path: '/login', name: 'login', component: LoginView, meta: { title: '登录', public: true } },
    { path: '/register', name: 'register', component: RegisterView, meta: { title: '注册', public: true } }
  ]
})

// 路由守卫：小园页面需要登录
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('tc_token')
  if (to.name === 'garden' && !token) {
    next({ name: 'login', query: { redirect: to.fullPath } })
  } else {
    next()
  }
})

export default router
