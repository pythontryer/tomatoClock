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
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  background: var(--card);
  border-bottom: 1px solid var(--border);
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.08);
  padding: 8px 16px calc(8px + env(safe-area-inset-top, 0px));
  padding-top: calc(8px + env(safe-area-inset-top, 0px));
  z-index: 100;
  backdrop-filter: blur(12px);
  background: color-mix(in srgb, var(--card) 85%, transparent);
}
.nav-item {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 6px;
  padding: 8px 18px;
  border-radius: 12px;
  text-decoration: none;
  color: var(--muted);
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  font-size: 13px;
}
.nav-item.active {
  color: var(--accent);
  background: var(--accent-soft);
  font-weight: 700;
}
.nav-icon {
  font-size: 18px;
  line-height: 1;
  transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.nav-item.active .nav-icon {
  transform: scale(1.15);
}
.nav-label {
  font-size: 13px;
  font-weight: 600;
}
@media (max-width: 480px) {
  .bottom-nav {
    gap: 4px;
    padding: 6px 8px calc(6px + env(safe-area-inset-top, 0px));
    padding-top: calc(6px + env(safe-area-inset-top, 0px));
  }
  .nav-item {
    padding: 6px 12px;
    gap: 4px;
  }
  .nav-label {
    font-size: 12px;
  }
  .nav-icon {
    font-size: 16px;
  }
}
</style>
