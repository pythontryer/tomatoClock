<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()

const navItems = [
  { name: 'focus', label: '专注', icon: '🍅' },
  { name: 'stats', label: '统计', icon: '📊' },
  { name: 'garden', label: '小园', icon: '🌱' },
  { name: 'settings', label: '设置', icon: '⚙️' }
]
</script>

<template>
  <nav class="bottom-nav">
    <router-link
      v-for="item in navItems"
      :key="item.name"
      :to="{ name: item.name }"
      class="nav-item"
      :class="{ active: route.name === item.name }"
    >
      <span class="nav-icon">{{ item.icon }}</span>
      <span class="nav-label">{{ item.label }}</span>
    </router-link>
  </nav>
</template>

<style scoped>
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-around;
  align-items: center;
  background: var(--card);
  border-top: 1px solid var(--border);
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.08);
  padding: 8px 0 calc(8px + env(safe-area-inset-bottom, 0px));
  z-index: 100;
}
.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 6px 16px;
  border-radius: 12px;
  text-decoration: none;
  color: var(--muted);
  transition: all 0.2s ease;
  position: relative;
}
.nav-item.active {
  color: var(--accent);
}
.nav-item.active::before {
  content: '';
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 24px;
  height: 3px;
  background: var(--accent-gradient);
  border-radius: 0 0 3px 3px;
}
.nav-icon {
  font-size: 22px;
  line-height: 1;
  transition: transform 0.2s ease;
}
.nav-item.active .nav-icon {
  transform: scale(1.15);
}
.nav-label {
  font-size: 11px;
  font-weight: 600;
}
@media (min-width: 768px) {
  .bottom-nav {
    position: sticky;
    bottom: auto;
    top: 0;
    border-top: none;
    border-bottom: 1px solid var(--border);
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
    padding: 10px 0;
  }
  .nav-item {
    flex-direction: row;
    gap: 8px;
    padding: 8px 20px;
  }
  .nav-item.active::before {
    top: auto;
    bottom: 0;
    border-radius: 3px 3px 0 0;
  }
  .nav-label {
    font-size: 13px;
  }
}
</style>
