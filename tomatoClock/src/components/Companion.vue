<script setup lang="ts">
import { computed } from 'vue'
import type { CompanionMood } from '@/types/models'
import { getSkin } from '@/constants'

const props = defineProps<{
  mood: CompanionMood
  skinId: string
  /** 庆祝特效字符（如 🎉 / ⭐ / 💗），仅在 happy 时飘出 */
  celebration?: string
  name?: string
}>()

const emit = defineEmits<{ (e: 'pet'): void }>()

const body = computed(() => getSkin(props.skinId).body)

// 庆祝粒子：happy 时飘出若干
const particles = computed(() => (props.mood === 'happy' ? [0, 1, 2, 3, 4] : []))
const particle = computed(() => props.celebration || '🎉')

// 眼睛样式：不同情绪切换
const eyeKind = computed(() => {
  if (props.mood === 'happy') return 'happy'
  if (props.mood === 'sad') return 'sad'
  return 'open'
})
</script>

<template>
  <div class="companion" :class="mood" @click="emit('pet')" role="img"
    :aria-label="`陪伴角色 ${name || '小猫'}（${mood}）`">
    <div class="particles">
      <span
        v-for="i in particles"
        :key="i"
        class="particle"
        :style="{ left: 18 + i * 16 + '%', animationDelay: i * 0.12 + 's' }"
        >{{ particle }}</span
      >
    </div>

    <svg class="cat" viewBox="0 0 160 160" aria-hidden="true">
      <!-- 椅子 -->
      <rect class="chair" x="30" y="118" width="100" height="9" rx="3" />
      <rect class="chair" x="34" y="127" width="9" height="26" rx="3" />
      <rect class="chair" x="117" y="127" width="9" height="26" rx="3" />
      <rect class="chair back" x="30" y="74" width="9" height="48" rx="4" />
      <rect class="chair back" x="121" y="74" width="9" height="48" rx="4" />

      <!-- 尾巴 -->
      <path class="tail" :fill="body" d="M116 118 q30 4 22 -34 q-3 18 -22 16 Z" />

      <!-- 身体 -->
      <ellipse class="body" cx="80" cy="108" rx="36" ry="30" :fill="body" />

      <!-- 前爪 -->
      <ellipse class="paw" cx="66" cy="132" rx="9" ry="7" :fill="body" />
      <ellipse class="paw" cx="94" cy="132" rx="9" ry="7" :fill="body" />

      <!-- 头 -->
      <g class="head">
        <!-- 耳朵 -->
        <path class="ear" :fill="body" d="M52 52 L46 24 L74 42 Z" />
        <path class="ear" :fill="body" d="M108 52 L114 24 L86 42 Z" />
        <path class="ear-in" d="M55 48 L52 33 L68 43 Z" />
        <path class="ear-in" d="M105 48 L108 33 L92 43 Z" />
        <circle class="head-shape" cx="80" cy="66" r="28" :fill="body" />

        <!-- 眼睛 -->
        <template v-if="eyeKind === 'open'">
          <circle class="eye" cx="70" cy="64" r="4.4" />
          <circle class="eye" cx="90" cy="64" r="4.4" />
          <circle class="eye-hl" cx="71.4" cy="62.6" r="1.4" />
          <circle class="eye-hl" cx="91.4" cy="62.6" r="1.4" />
        </template>
        <template v-else-if="eyeKind === 'happy'">
          <path class="eye-arc" d="M64 65 q6 -7 12 0" />
          <path class="eye-arc" d="M84 65 q6 -7 12 0" />
          <circle class="cheek" cx="62" cy="72" r="4" />
          <circle class="cheek" cx="98" cy="72" r="4" />
        </template>
        <template v-else>
          <path class="eye-arc down" d="M64 67 q6 7 12 0" />
          <path class="eye-arc down" d="M84 67 q6 7 12 0" />
        </template>

        <!-- 鼻子 + 嘴 -->
        <path class="nose" d="M76 72 L84 72 L80 77 Z" />
        <path class="mouth" d="M80 77 q-4 4 -8 1 M80 77 q4 4 8 1" />

        <!-- 胡须 -->
        <path class="whisker" d="M52 70 L34 66 M52 74 L34 76" />
        <path class="whisker" d="M108 70 L126 66 M108 74 L126 76" />
      </g>

      <!-- 炸毛（失败）标记 -->
      <text v-if="mood === 'sad'" class="angry" x="120" y="40">💢</text>
    </svg>

    <div class="name" v-if="name">{{ name }}</div>
  </div>
</template>

<style scoped>
.companion {
  position: relative;
  width: 132px;
  margin: 4px auto 2px;
  cursor: pointer;
  user-select: none;
}
.cat {
  width: 100%;
  display: block;
}
.chair {
  fill: #c9b08a;
}
.chair.back {
  fill: #b89a72;
}
.ear-in {
  fill: #f2b8c6;
}
.eye {
  fill: #2b2b30;
}
.eye-hl {
  fill: #fff;
}
.eye-arc {
  fill: none;
  stroke: #2b2b30;
  stroke-width: 2.4;
  stroke-linecap: round;
}
.cheek {
  fill: #f4a6b8;
  opacity: 0.65;
}
.nose {
  fill: #e08ba0;
}
.mouth {
  fill: none;
  stroke: #7a5a52;
  stroke-width: 1.4;
  stroke-linecap: round;
}
.whisker {
  stroke: #b9a99a;
  stroke-width: 1.2;
  stroke-linecap: round;
  fill: none;
}
.angry {
  font-size: 18px;
}
.name {
  text-align: center;
  font-size: 12px;
  color: var(--muted);
  margin-top: 2px;
}

/* 情绪动画 */
.companion.focusing .cat {
  animation: bob 2.4s ease-in-out infinite;
}
.companion.happy .cat {
  animation: pop 0.5s ease;
}
.companion.sad .cat {
  animation: shake 0.5s ease;
}
@keyframes bob {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}
@keyframes pop {
  0% { transform: scale(1); }
  40% { transform: scale(1.08); }
  100% { transform: scale(1); }
}
@keyframes shake {
  0%, 100% { transform: translateX(0) rotate(0); }
  25% { transform: translateX(-3px) rotate(-2deg); }
  75% { transform: translateX(3px) rotate(2deg); }
}

/* 庆祝粒子 */
.particles {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.particle {
  position: absolute;
  top: 30%;
  font-size: 16px;
  animation: floatUp 1.4s ease-out forwards;
  opacity: 0;
}
@keyframes floatUp {
  0% { transform: translateY(0) scale(0.6); opacity: 0; }
  20% { opacity: 1; }
  100% { transform: translateY(-46px) scale(1.1); opacity: 0; }
}

@media (prefers-reduced-motion: reduce) {
  .companion.focusing .cat,
  .companion.happy .cat,
  .companion.sad .cat,
  .particle {
    animation: none;
  }
}
</style>
