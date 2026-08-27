<script setup lang="ts">
import { useToasts } from '@/composables/useToast'

const { toasts } = useToasts()
</script>

<template>
  <div class="toast-host" aria-live="polite">
    <transition-group name="toast">
      <div v-for="t in toasts" :key="t.id" class="toast" :class="t.type">
        {{ t.text }}
      </div>
    </transition-group>
  </div>
</template>

<style scoped>
.toast-host {
  position: fixed;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 9999;
  pointer-events: none;
}
.toast {
  padding: 10px 16px;
  border-radius: 10px;
  font-size: 14px;
  color: #fff;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.18);
  background: #333;
  max-width: 320px;
  text-align: center;
}
.toast.info {
  background: var(--accent, #5b6cff);
}
.toast.good {
  background: var(--good, #2bb673);
}
.toast.warn {
  background: var(--warn, #e0533d);
}
.toast-enter-active,
.toast-leave-active {
  transition: all 0.25s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
