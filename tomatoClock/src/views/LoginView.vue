<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/useUserStore'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const email = ref('')
const password = ref('')
const remember = ref(false)
const showSecurityTip = ref(true)
const error = ref('')
const loading = ref(false)

async function handleLogin() {
  error.value = ''
  if (!email.value || !password.value) {
    error.value = '请输入邮箱和密码'
    return
  }
  loading.value = true
  try {
    await userStore.doLogin(email.value.trim(), password.value, remember.value)
    const redirect = (route.query.redirect as string) || '/'
    router.push(redirect)
  } catch (e: unknown) {
    error.value = (e as Error).message || '登录失败'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-card">
      <div class="auth-logo">🍅</div>
      <h1 class="auth-title">专注与习惯面板</h1>
      <p class="auth-subtitle">登录后道具可永久保存，支持赠送和收藏</p>

      <form class="auth-form" @submit.prevent="handleLogin">
        <div class="form-group">
          <label>邮箱</label>
          <input
            v-model="email"
            type="email"
            placeholder="your@email.com"
            autocomplete="email"
          />
        </div>
        <div class="form-group">
          <label>密码</label>
          <input
            v-model="password"
            type="password"
            placeholder="至少6位"
            autocomplete="current-password"
          />
        </div>
        <div class="remember-row">
          <label class="remember-label">
            <input v-model="remember" type="checkbox" class="remember-checkbox" />
            <span>是否永远自动登录</span>
          </label>
        </div>
        <div v-if="showSecurityTip" class="security-tip">
          <div class="security-tip-header">
            <span class="security-icon">⚠️</span>
            <span class="security-title">安全提示</span>
            <button class="security-close" @click="showSecurityTip = false">×</button>
          </div>
          <p class="security-text">
            勾选「永远自动登录」后，本设备将长期保持登录状态，无需重复输入密码。
            <strong>仅在你自己的私人电脑或确保安全的设备上勾选</strong>。
            在公共电脑、网吧、他人设备上请勿勾选，以免账号和数字藏品被盗。
          </p>
        </div>
        <div v-if="error" class="form-error">{{ error }}</div>
        <button type="submit" class="auth-btn" :disabled="loading">
          {{ loading ? '登录中...' : '登录' }}
        </button>
      </form>

      <div class="auth-footer">
        还没有账号？
        <router-link to="/register" class="auth-link">立即注册</router-link>
      </div>
      <div class="auth-footer">
        <router-link to="/" class="auth-link-muted">先逛逛，不登录</router-link>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}
.auth-card {
  background: white;
  border-radius: 20px;
  padding: 40px 36px;
  width: 100%;
  max-width: 380px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.15);
}
.auth-logo {
  font-size: 56px;
  text-align: center;
  margin-bottom: 8px;
}
.auth-title {
  font-size: 22px;
  font-weight: 800;
  text-align: center;
  color: #1a1a2e;
  margin: 0 0 6px;
}
.auth-subtitle {
  font-size: 13px;
  color: #888;
  text-align: center;
  margin: 0 0 28px;
}
.auth-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.form-group label {
  font-size: 13px;
  font-weight: 600;
  color: #555;
}
.form-group input {
  padding: 12px 14px;
  border: 1.5px solid #e0e0e0;
  border-radius: 10px;
  font-size: 14px;
  transition: border-color 0.2s;
  outline: none;
}
.form-group input:focus {
  border-color: #667eea;
}
.form-error {
  color: #e74c3c;
  font-size: 13px;
  text-align: center;
}
.remember-row {
  display: flex;
  align-items: center;
}
.remember-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #666;
  cursor: pointer;
  user-select: none;
}
.remember-checkbox {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: #667eea;
}
.security-tip {
  background: #fff8e1;
  border: 1px solid #ffc107;
  border-radius: 10px;
  padding: 12px 14px;
  margin-bottom: 4px;
}
.security-tip-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
}
.security-icon {
  font-size: 16px;
}
.security-title {
  font-size: 13px;
  font-weight: 600;
  color: #e65100;
  flex: 1;
}
.security-close {
  background: none;
  border: none;
  font-size: 18px;
  color: #999;
  cursor: pointer;
  line-height: 1;
  padding: 0 4px;
}
.security-close:hover {
  color: #666;
}
.security-text {
  font-size: 12px;
  color: #5d4037;
  line-height: 1.6;
  margin: 0;
}
.security-text strong {
  color: #e65100;
}
.auth-btn {
  padding: 13px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.1s;
}
.auth-btn:hover:not(:disabled) { opacity: 0.9; }
.auth-btn:active:not(:disabled) { transform: scale(0.98); }
.auth-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.auth-footer {
  text-align: center;
  font-size: 13px;
  color: #888;
  margin-top: 16px;
}
.auth-link {
  color: #667eea;
  font-weight: 600;
  text-decoration: none;
}
.auth-link:hover { text-decoration: underline; }
.auth-link-muted {
  color: #aaa;
  text-decoration: none;
}
.auth-link-muted:hover { color: #888; }
</style>
