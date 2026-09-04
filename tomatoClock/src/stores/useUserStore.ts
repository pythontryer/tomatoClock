import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { register, login, getMe, type UserInfo } from '@/utils/api'

export const useUserStore = defineStore('user', () => {
  const token = ref<string | null>(localStorage.getItem('tc_token'))
  const user = ref<UserInfo | null>(null)
  const loading = ref(false)

  const isLoggedIn = computed(() => !!token.value && !!user.value)

  function setAuth(t: string, u: UserInfo) {
    token.value = t
    user.value = u
    localStorage.setItem('tc_token', t)
    localStorage.setItem('tc_user', JSON.stringify(u))
  }

  function clearAuth() {
    token.value = null
    user.value = null
    localStorage.removeItem('tc_token')
    localStorage.removeItem('tc_user')
  }

  async function doRegister(email: string, password: string, nickname: string, remember = false) {
    loading.value = true
    try {
      const result = await register(email, password, nickname, remember)
      setAuth(result.token, result.user)
      return result
    } finally {
      loading.value = false
    }
  }

  async function doLogin(email: string, password: string, remember = false) {
    loading.value = true
    try {
      const result = await login(email, password, remember)
      setAuth(result.token, result.user)
      return result
    } finally {
      loading.value = false
    }
  }

  function logout() {
    clearAuth()
  }

  async function fetchUserInfo() {
    if (!token.value) return null
    try {
      const u = await getMe()
      user.value = u
      localStorage.setItem('tc_user', JSON.stringify(u))
      return u
    } catch {
      clearAuth()
      return null
    }
  }

  // 初始化时从 localStorage 恢复用户信息
  function initFromStorage() {
    const savedUser = localStorage.getItem('tc_user')
    if (savedUser && token.value) {
      try {
        user.value = JSON.parse(savedUser)
      } catch {
        user.value = null
      }
    }
  }

  return {
    token,
    user,
    loading,
    isLoggedIn,
    doRegister,
    doLogin,
    logout,
    fetchUserInfo,
    initFromStorage
  }
})
