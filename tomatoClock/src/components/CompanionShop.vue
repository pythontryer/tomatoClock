<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '@/stores/useAppStore'
import { PLANT_FORMS, CELEBRATIONS, getCelebration, plantStage } from '@/constants'
import Companion from './Companion.vue'

const store = useAppStore()
const coins = computed(() => store.companion.coins)

const name = computed({
  get: () => store.companion.name,
  set: (v: string) => store.setCompanionName(v)
})
const completeMsg = computed({
  get: () => store.companion.completeMsg,
  set: (v: string) => store.setCompanionMsg('complete', v)
})
const failMsg = computed({
  get: () => store.companion.failMsg,
  set: (v: string) => store.setCompanionMsg('fail', v)
})

function isUnlocked(id: string) {
  return store.companion.unlocked.includes(id)
}
function canAfford(cost: number) {
  return coins.value >= cost
}
function celebrationChar() {
  return getCelebration(store.companion.activeCelebration).particle
}
</script>

<template>
  <section class="card shop">
    <h2>🌱 专注小园</h2>
    <p class="muted sub">
      完成专注攒
      <b>💧 专注露珠</b>，解锁植物形态与庆祝特效，陪你的小园一天天长高、开花。数据只存在你本机。
    </p>

    <div class="balance">余额：💧 {{ coins }}</div>

    <div class="preview">
      <Companion
        mood="idle"
        :skin-id="store.companion.activeCompanion"
        :stage="plantStage(store.pomoCycle)"
        :celebration="celebrationChar()"
        :name="store.companion.name"
      />
    </div>

    <div class="field">
      <label>给小园起个名字</label>
      <input v-model="name" maxlength="16" placeholder="小绿" />
    </div>

    <h3>植物形态</h3>
    <div class="grid2">
      <div v-for="s in PLANT_FORMS" :key="s.id" class="item" :class="{ owned: isUnlocked(s.id) }">
        <div class="item-name">{{ s.name }}</div>
        <div class="item-desc muted">{{ s.desc }}</div>
        <button
          v-if="!isUnlocked(s.id)"
          class="btn small"
          :disabled="!canAfford(s.cost)"
          @click="store.unlockCosmetic(s.id)"
        >
          解锁 · {{ s.cost }}💧
        </button>
        <button
          v-else-if="store.companion.activeCompanion !== s.id"
          class="btn small primary"
          @click="store.setActiveCompanion(s.id)"
        >
          选用
        </button>
        <span v-else class="tag">使用中</span>
      </div>
    </div>

    <h3>庆祝特效</h3>
    <div class="grid2">
      <div v-for="c in CELEBRATIONS" :key="c.id" class="item" :class="{ owned: isUnlocked(c.id) }">
        <div class="item-name">{{ c.particle }} {{ c.name }}</div>
        <div class="item-desc muted">{{ c.desc }}</div>
        <button
          v-if="!isUnlocked(c.id)"
          class="btn small"
          :disabled="!canAfford(c.cost)"
          @click="store.unlockCosmetic(c.id)"
        >
          解锁 · {{ c.cost }}💧
        </button>
        <button
          v-else-if="store.companion.activeCelebration !== c.id"
          class="btn small primary"
          @click="store.setActiveCelebration(c.id)"
        >
          选用
        </button>
        <span v-else class="tag">使用中</span>
      </div>
    </div>

    <h3>自定义寄语</h3>
    <div class="field">
      <label>完成专注时（留空用默认）</label>
      <input v-model="completeMsg" maxlength="60" placeholder="🍅 专注完成！小园又长高了一点~" />
    </div>
    <div class="field">
      <label>提前退出时（留空用默认，温和不羞辱）</label>
      <input v-model="failMsg" maxlength="60" placeholder="这次小苗渴了，下次再陪它专注吧" />
    </div>
  </section>
</template>

<style scoped>
.shop {
  text-align: left;
}
.sub {
  font-size: 13px;
  margin: 4px 0 10px;
}
.balance {
  font-size: 14px;
  font-weight: 600;
  color: var(--accent);
  margin-bottom: 8px;
}
.preview {
  display: flex;
  justify-content: center;
  padding: 6px 0 12px;
  border-bottom: 1px solid var(--border);
  margin-bottom: 12px;
}
.field {
  margin: 8px 0;
}
.field label {
  display: block;
  font-size: 12px;
  color: var(--muted);
  margin-bottom: 4px;
}
.field input {
  width: 100%;
  padding: 7px 10px;
  border: 1px solid var(--border);
  border-radius: 9px;
  font-size: 13px;
  background: var(--card);
  color: var(--text);
}
h3 {
  font-size: 14px;
  margin: 14px 0 8px;
}
.grid2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.item {
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 8px 10px;
  background: var(--card);
}
.item.owned {
  border-color: var(--accent);
}
.item-name {
  font-size: 13px;
  font-weight: 600;
}
.item-desc {
  font-size: 11px;
  margin: 2px 0 8px;
}
.btn.small {
  padding: 3px 10px;
  font-size: 12px;
  width: 100%;
}
.btn.small:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.tag {
  display: inline-block;
  font-size: 12px;
  color: var(--accent);
  font-weight: 600;
}
@media (max-width: 520px) {
  .grid2 {
    grid-template-columns: 1fr;
  }
}
</style>
