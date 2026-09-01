<script setup lang="ts">
import { computed } from 'vue'
import type { CompanionMood } from '@/types/models'
import {
  getForm,
  PLANT_STAGE_COUNT,
  PLANT_STAGE_STEM_HEIGHTS,
  PLANT_STAGE_LEAF_PAIRS,
  PLANT_BLOOM_STAGE
} from '@/constants'

const props = defineProps<{
  mood: CompanionMood
  /** 植物形态 id（多肉/薄荷/薰衣草/向日葵…） */
  skinId: string
  /** 成长阶段 0 ~ PLANT_STAGE_COUNT-1，由已完成专注数推导 */
  stage: number
  /** 庆祝特效字符（如 🎉 / ⭐ / 💗），仅在 happy 时飘出 */
  celebration?: string
  name?: string
}>()

const emit = defineEmits<{ (e: 'tend'): void }>()

const body = computed(() => getForm(props.skinId).body)

const stageIdx = computed(() =>
  Math.min(PLANT_STAGE_COUNT - 1, Math.max(0, Math.floor(props.stage)))
)
const stemH = computed(() => PLANT_STAGE_STEM_HEIGHTS[stageIdx.value])
const stemTopY = computed(() => 118 - stemH.value)
const pairCount = computed(() => PLANT_STAGE_LEAF_PAIRS[stageIdx.value])

// 沿茎生成左右对称的叶片位置
const leaves = computed(() => {
  const arr: { y: number; side: 'l' | 'r' }[] = []
  const baseY = 116
  for (let i = 0; i < pairCount.value; i++) {
    const y = baseY - ((i + 1) * stemH.value) / (pairCount.value + 1)
    arr.push({ y, side: 'l' })
    arr.push({ y, side: 'r' })
  }
  return arr
})

const blooming = computed(() => stageIdx.value >= PLANT_BLOOM_STAGE)
const particles = computed(() => (props.mood === 'happy' ? [0, 1, 2, 3, 4] : []))
const particle = computed(() => props.celebration || '🎉')
</script>

<template>
  <div class="companion" :class="mood" @click="emit('tend')" role="img"
    :aria-label="`专注植物 ${name || '小绿'}（阶段 ${stage + 1}，状态 ${mood}）`">
    <div class="particles">
      <span
        v-for="i in particles"
        :key="i"
        class="particle"
        :style="{ left: 18 + i * 16 + '%', animationDelay: i * 0.12 + 's' }"
        >{{ particle }}</span
      >
    </div>

    <svg class="plant" viewBox="0 0 160 160" aria-hidden="true">
      <g class="plant-body">
        <!-- 盆 -->
        <path class="pot" d="M52 118 L108 118 L100 150 L60 150 Z" />
        <rect class="pot-rim" x="48" y="112" width="64" height="9" rx="3" />
        <!-- 土 -->
        <ellipse class="soil" cx="80" cy="116" rx="27" ry="5" />

        <!-- 茎 -->
        <rect class="stem" x="78" :y="stemTopY" width="4" :height="stemH" rx="2" :fill="body" />

        <!-- 叶 -->
        <g v-for="(lf, idx) in leaves" :key="idx" :class="['leaf', lf.side]">
          <ellipse
            :cx="lf.side === 'l' ? 70 : 90"
            :cy="lf.y"
            rx="13"
            ry="6.5"
            :fill="body"
            :transform="`rotate(${lf.side === 'l' ? -32 : 32} ${lf.side === 'l' ? 78 : 82} ${lf.y})`"
          />
        </g>

        <!-- 花（满级绽放） -->
        <g v-if="blooming" class="bloom">
          <circle :cx="80" :cy="stemTopY - 4" r="9" :fill="body" />
          <circle :cx="80" :cy="stemTopY - 4" r="4" fill="#fff3c4" />
        </g>
      </g>
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
.plant {
  width: 100%;
  display: block;
  transform-origin: 50% 100%;
}
.pot {
  fill: #c9744f;
}
.pot-rim {
  fill: #d98863;
}
.soil {
  fill: #5b4636;
}
.stem {
  fill: #6aa05a;
}
.leaf {
  transform-origin: 80px 116px;
}
.name {
  text-align: center;
  font-size: 12px;
  color: var(--muted);
  margin-top: 2px;
}

/* 情绪动画 */
.companion.focusing .plant-body {
  animation: sway 2.6s ease-in-out infinite;
}
.companion.happy .plant-body {
  animation: pop 0.5s ease;
}
.companion.sad .plant {
  animation: droop 0.5s ease;
}
@keyframes sway {
  0%, 100% { transform: rotate(0deg); }
  50% { transform: rotate(2.5deg); }
}
@keyframes pop {
  0% { transform: scale(1); }
  40% { transform: scale(1.08); }
  100% { transform: scale(1); }
}
@keyframes droop {
  0%, 100% { transform: rotate(0); }
  50% { transform: rotate(-4deg); }
}

/* 庆祝粒子 */
.particles {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.particle {
  position: absolute;
  top: 28%;
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
  .companion.focusing .plant-body,
  .companion.happy .plant-body,
  .companion.sad .plant,
  .particle {
    animation: none;
  }
}
</style>
