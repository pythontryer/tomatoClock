<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useAppStore } from '@/stores/useAppStore'
import {
  EVOLUTION_FORMS,
  EVOLUTION_ITEMS,
  type EvolutionForm,
  type EvolutionItem,
  type EvolutionResult
} from '@/constants/evolution'
import { getFocusLevel, getNextLevel } from '@/constants'
import { checkAiHealth } from '@/utils/aiApi'
import type { CustomItem } from '@/types/models'

const store = useAppStore()

// AI 服务状态
const aiAvailable = ref(false)
const aiGenerating = ref(false)
const aiMsg = ref<string | null>(null)

onMounted(async () => {
  const health = await checkAiHealth()
  aiAvailable.value = health.ok && health.apiKeyConfigured
})

// 当前形态
const currentForm = computed<EvolutionForm>(
  () => EVOLUTION_FORMS.find((f) => f.id === store.evolution.formId) ?? EVOLUTION_FORMS[0]
)

// 想要的道具（先查预设，再查自定义）
const wantedItem = computed<EvolutionItem | CustomItem>(() => {
  const preset = EVOLUTION_ITEMS.find((i) => i.id === store.evolution.wantedItemId)
  if (preset) return preset
  const custom = store.evolution.customItems.find((i) => i.id === store.evolution.wantedItemId)
  return custom || EVOLUTION_ITEMS[0]
})

// 所有道具（预设 + 自定义），有数量的
type InventoryItem = (EvolutionItem | CustomItem) & { count: number }
const inventoryItems = computed<InventoryItem[]>(() => {
  const items: InventoryItem[] = []
  for (const preset of EVOLUTION_ITEMS) {
    const count = store.evolution.inventory[preset.id] ?? 0
    if (count > 0) items.push({ ...preset, count })
  }
  for (const custom of store.evolution.customItems) {
    const count = store.evolution.inventory[custom.id] ?? 0
    if (count > 0) items.push({ ...custom, count })
  }
  return items
})

// 总道具数
const totalItems = computed(() =>
  Object.values(store.evolution.inventory).reduce((sum, n) => sum + (n || 0), 0)
)

// 专注等级
const currentLevel = computed(() => getFocusLevel(store.pomoCycle))
const nextLevel = computed(() => getNextLevel(store.pomoCycle))
const levelProgress = computed(() => {
  if (!nextLevel.value) return 100
  const prev = currentLevel.value.minPomo
  const next = nextLevel.value.minPomo
  return Math.min(100, Math.round(((store.pomoCycle - prev) / (next - prev)) * 100))
})

// 变化反馈
const evolutionMsg = ref<string | null>(null)
const evolutionRarity = ref<string>('common')
const isEvolving = ref(false)
let msgTimer: ReturnType<typeof setTimeout> | null = null

function useItem(item: EvolutionItem) {
  if (isEvolving.value) return
  const count = store.evolution.inventory[item.id] ?? 0
  if (count < 1) return

  isEvolving.value = true
  // 延迟一点显示动画效果
  setTimeout(() => {
    const result = store.useEvolutionItem(item.id)
    isEvolving.value = false
    if (result) {
      showResult(result)
    }
  }, 600)
}

function showResult(result: EvolutionResult) {
  evolutionMsg.value = result.message
  evolutionRarity.value = result.rarity
  if (msgTimer) clearTimeout(msgTimer)
  msgTimer = setTimeout(() => (evolutionMsg.value = null), 4000)
}

function refreshWanted() {
  store.refreshWantedItem()
}

// AI 生成道具
async function generateItem() {
  if (aiGenerating.value) return
  aiGenerating.value = true
  aiMsg.value = null
  try {
    const item = await store.generateAiItemAction()
    if (item) {
      aiMsg.value = `✨ AI 生成了「${item.emoji} ${item.name}」（${rarityLabel(item.rarity)}）！`
    } else {
      aiMsg.value = '❌ AI 生成失败，请检查后端 API Key 配置'
    }
  } finally {
    aiGenerating.value = false
    setTimeout(() => (aiMsg.value = null), 4000)
  }
}

// 稀有度颜色
function rarityColor(rarity: string): string {
  if (rarity === 'legendary') return '#FFD700'
  if (rarity === 'rare') return '#9b6bff'
  return '#2bbf8a'
}

function rarityLabel(rarity: string): string {
  if (rarity === 'legendary') return '传说'
  if (rarity === 'rare') return '稀有'
  return '普通'
}

// 图鉴
const discoveredCount = computed(() => store.evolution.discoveredForms.length)
const totalForms = EVOLUTION_FORMS.length
</script>

<template>
  <div class="garden-view">
    <div class="page-header">
      <h1 class="page-title">专注小园</h1>
      <p class="page-subtitle">完成番茄钟获得道具，给小伙伴使用触发奇妙变化</p>
    </div>

    <!-- 当前形态展示区 -->
    <section
      class="card evolution-hero"
      :style="{ background: `linear-gradient(135deg, ${currentForm.bgFrom}22, ${currentForm.bgTo}33)` }"
    >
      <!-- 形态展示 -->
      <div class="hero-display">
        <div class="form-emoji-wrap" :class="{ evolving: isEvolving }">
          <span class="form-emoji">{{ currentForm.emoji }}</span>
          <span v-if="store.evolution.decoration" class="form-decoration">{{ store.evolution.decoration }}</span>
        </div>
        <div class="form-info">
          <div class="form-name-row">
            <span class="form-name">{{ store.evolution.name }}</span>
            <span class="form-rarity" :style="{ color: rarityColor(currentForm.rarity) }">
              {{ rarityLabel(currentForm.rarity) }}
            </span>
          </div>
          <div class="form-title">{{ currentForm.name }}</div>
          <div class="form-desc">{{ currentForm.desc }}</div>
        </div>
      </div>

      <!-- 变化消息 -->
      <transition name="pop">
        <div v-if="evolutionMsg" class="evolution-msg" :style="{ borderColor: rarityColor(evolutionRarity) }">
          {{ evolutionMsg }}
        </div>
      </transition>

      <!-- 想要的道具 -->
      <div class="wanted-box">
        <span class="wanted-label">💭 现在想要</span>
        <span class="wanted-item" title="点击刷新" @click="refreshWanted">
          {{ wantedItem.emoji }} {{ wantedItem.name }}
        </span>
        <span class="wanted-hint">给它想要的道具，变化概率更高哦~</span>
      </div>

      <!-- 专注等级 -->
      <div class="focus-level">
        <div class="level-header">
          <span class="level-icon">{{ currentLevel.icon }}</span>
          <span class="level-name">{{ currentLevel.name }}</span>
          <span class="level-pomo">累计 {{ store.pomoCycle }} 番茄</span>
        </div>
        <div v-if="nextLevel" class="level-progress">
          <div class="level-progress-bar">
            <div class="level-progress-fill" :style="{ width: levelProgress + '%' }"></div>
          </div>
          <span class="level-progress-text">
            再完成 {{ nextLevel.minPomo - store.pomoCycle }} 个番茄升级为「{{ nextLevel.name }}」
          </span>
        </div>
        <div v-else class="level-max">已达最高等级，继续保持！</div>
      </div>

      <!-- 统计 -->
      <div class="hero-stats">
        <div class="stat">
          <div class="stat-val">{{ store.pomoCycle }}</div>
          <div class="stat-label">累计番茄</div>
        </div>
        <div class="stat">
          <div class="stat-val">{{ totalItems }}</div>
          <div class="stat-label">道具数量</div>
        </div>
        <div class="stat">
          <div class="stat-val">{{ discoveredCount }}/{{ totalForms }}</div>
          <div class="stat-label">图鉴收集</div>
        </div>
      </div>
    </section>

    <!-- 道具背包 -->
    <section class="card inventory-section">
      <div class="section-header">
        <h2 class="section-title">🎒 道具背包</h2>
        <div class="section-actions">
          <button
            v-if="aiAvailable"
            class="ai-generate-btn"
            :class="{ loading: aiGenerating }"
            :disabled="aiGenerating"
            @click="generateItem"
          >
            {{ aiGenerating ? '生成中...' : '✨ AI 生成道具' }}
          </button>
          <span v-else class="section-hint">点击道具给小伙伴使用</span>
        </div>
      </div>
      <transition name="fade">
        <div v-if="aiMsg" class="ai-msg">{{ aiMsg }}</div>
      </transition>
      <div v-if="inventoryItems.length === 0" class="empty-state">
        <div class="empty-icon">📦</div>
        <p>背包空空如也~</p>
        <p class="empty-sub">完成番茄钟即可获得随机道具</p>
      </div>
      <div v-else class="inventory-grid">
        <button
          v-for="item in inventoryItems"
          :key="item.id"
          class="inventory-item"
          :class="{ wanted: item.id === wantedItem.id }"
          :disabled="isEvolving"
          @click="useItem(item)"
        >
          <span class="item-emoji">{{ item.emoji }}</span>
          <span class="item-name">{{ item.name }}</span>
          <span class="item-count">×{{ store.evolution.inventory[item.id] }}</span>
          <span v-if="item.id === wantedItem.id" class="item-wanted-tag">想要</span>
        </button>
      </div>
    </section>

    <!-- 进化历史 -->
    <section v-if="store.evolution.history.length > 0" class="card history-section">
      <div class="section-header">
        <h2 class="section-title">📜 进化日志</h2>
      </div>
      <div class="history-list">
        <div
          v-for="(entry, idx) in store.evolution.history.slice(0, 8)"
          :key="idx"
          class="history-item"
        >
          <span class="history-rarity" :style="{ background: rarityColor(entry.rarity) }"></span>
          <span class="history-text">{{ entry.message }}</span>
        </div>
      </div>
    </section>

    <!-- 图鉴 -->
    <section class="card collection-section">
      <div class="section-header">
        <h2 class="section-title">📖 形态图鉴</h2>
        <span class="section-hint">已发现 {{ discoveredCount }}/{{ totalForms }}</span>
      </div>
      <div class="collection-grid">
        <div
          v-for="form in EVOLUTION_FORMS"
          :key="form.id"
          class="collection-item"
          :class="{ discovered: store.evolution.discoveredForms.includes(form.id), active: form.id === currentForm.id }"
          :title="store.evolution.discoveredForms.includes(form.id) ? form.name : '???'"
        >
          <span class="collection-emoji">
            {{ store.evolution.discoveredForms.includes(form.id) ? form.emoji : '❓' }}
          </span>
          <span class="collection-name">
            {{ store.evolution.discoveredForms.includes(form.id) ? form.name : '???' }}
          </span>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.garden-view {
  padding-bottom: 20px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

/* 形态展示区 */
.evolution-hero {
  text-align: center;
  padding: 28px 22px;
  position: relative;
  overflow: hidden;
}

.hero-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.form-emoji-wrap {
  position: relative;
  width: 120px;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 50%;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.form-emoji {
  font-size: 64px;
  animation: float 3s ease-in-out infinite;
}

.form-emoji-wrap.evolving .form-emoji {
  animation: evolve 0.6s ease-in-out;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

@keyframes evolve {
  0% { transform: scale(1) rotate(0); filter: brightness(1); }
  50% { transform: scale(1.3) rotate(10deg); filter: brightness(1.5); }
  100% { transform: scale(1) rotate(0); filter: brightness(1); }
}

.form-decoration {
  position: absolute;
  top: -8px;
  right: -8px;
  font-size: 32px;
  animation: float 2s ease-in-out infinite;
}

.form-info {
  text-align: center;
}

.form-name-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.form-name {
  font-size: 20px;
  font-weight: 800;
  color: var(--text);
}

.form-rarity {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 999px;
  background: currentColor;
  color: white !important;
  opacity: 0.9;
}

.form-title {
  font-size: 14px;
  color: var(--muted);
  margin-top: 2px;
}

.form-desc {
  font-size: 12px;
  color: var(--muted);
  margin-top: 4px;
  opacity: 0.8;
}

/* 变化消息 */
.evolution-msg {
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
  margin: 0 auto 16px;
  padding: 10px 16px;
  background: var(--bg);
  border: 2px solid var(--accent);
  border-radius: 12px;
  max-width: 360px;
  line-height: 1.5;
}

.pop-enter-active {
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.pop-leave-active {
  transition: all 0.3s ease;
}
.pop-enter-from {
  opacity: 0;
  transform: scale(0.8) translateY(-10px);
}
.pop-leave-to {
  opacity: 0;
  transform: translateY(-5px);
}

/* 想要的道具 */
.wanted-box {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;
  padding: 10px 16px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 12px;
  margin-bottom: 16px;
}

.wanted-label {
  font-size: 12px;
  color: var(--muted);
  font-weight: 500;
}

.wanted-item {
  font-size: 15px;
  font-weight: 700;
  color: var(--accent);
  cursor: pointer;
  padding: 2px 8px;
  border-radius: 8px;
  transition: background 0.2s;
}

.wanted-item:hover {
  background: var(--accent-soft);
}

.wanted-hint {
  font-size: 11px;
  color: var(--muted);
  opacity: 0.7;
  width: 100%;
  margin-top: 4px;
}

/* 专注等级 */
.focus-level {
  width: 100%;
  max-width: 320px;
  margin: 0 auto 16px;
  padding: 12px 16px;
  background: linear-gradient(135deg, rgba(255, 174, 66, 0.08), rgba(255, 107, 107, 0.08));
  border-radius: var(--radius);
  border: 1px solid rgba(255, 174, 66, 0.2);
}

.level-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.level-icon {
  font-size: 20px;
}

.level-name {
  font-size: 14px;
  font-weight: 700;
  color: var(--text);
}

.level-pomo {
  margin-left: auto;
  font-size: 11px;
  color: var(--muted);
}

.level-progress-bar {
  height: 6px;
  background: rgba(0, 0, 0, 0.08);
  border-radius: 999px;
  overflow: hidden;
  margin-bottom: 6px;
}

.level-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #ffae42, #ff6b6b);
  border-radius: 999px;
  transition: width 0.6s ease;
}

.level-progress-text {
  font-size: 11px;
  color: var(--muted);
}

.level-max {
  font-size: 12px;
  color: var(--good);
  font-weight: 600;
  text-align: center;
}

/* 统计 */
.hero-stats {
  display: flex;
  justify-content: center;
  gap: 28px;
  padding: 18px 20px;
  background: linear-gradient(135deg, var(--accent-soft), rgba(139, 92, 246, 0.05));
  border-radius: var(--radius-sm);
}

.stat {
  text-align: center;
}

.stat-val {
  font-size: 26px;
  font-weight: 800;
  background: var(--accent-gradient);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  font-variant-numeric: tabular-nums;
  line-height: 1.2;
}

.stat-label {
  font-size: 11px;
  color: var(--muted);
  margin-top: 4px;
  font-weight: 500;
}

/* 通用 section */
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.section-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--text);
}

.section-hint {
  font-size: 12px;
  color: var(--muted);
}

.section-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ai-generate-btn {
  font-size: 12px;
  font-weight: 600;
  padding: 6px 12px;
  border: none;
  border-radius: 999px;
  background: linear-gradient(135deg, #9b6bff, #5b6cff);
  color: white;
  cursor: pointer;
  transition: all 0.2s;
}

.ai-generate-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(155, 107, 255, 0.3);
}

.ai-generate-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.ai-generate-btn.loading {
  animation: pulse 1s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

.ai-msg {
  font-size: 13px;
  font-weight: 600;
  color: var(--accent);
  margin-bottom: 12px;
  padding: 8px 14px;
  background: var(--accent-soft);
  border-radius: 8px;
}

/* 道具背包 */
.empty-state {
  text-align: center;
  padding: 32px 20px;
  color: var(--muted);
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 8px;
}

.empty-state p {
  margin: 4px 0;
  font-size: 14px;
}

.empty-sub {
  font-size: 12px !important;
  opacity: 0.7;
}

.inventory-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 10px;
}

.inventory-item {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 8px;
  background: var(--bg);
  border: 2px solid transparent;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.inventory-item:hover:not(:disabled) {
  transform: translateY(-2px);
  border-color: var(--accent);
  box-shadow: 0 4px 12px rgba(91, 108, 255, 0.15);
}

.inventory-item:active:not(:disabled) {
  transform: scale(0.95);
}

.inventory-item:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.inventory-item.wanted {
  border-color: #ffae42;
  background: linear-gradient(135deg, rgba(255, 174, 66, 0.1), rgba(255, 174, 66, 0.05));
}

.item-emoji {
  font-size: 28px;
}

.item-name {
  font-size: 11px;
  color: var(--text);
  font-weight: 500;
  text-align: center;
}

.item-count {
  font-size: 12px;
  color: var(--muted);
  font-weight: 700;
}

.item-wanted-tag {
  position: absolute;
  top: -6px;
  right: -6px;
  font-size: 9px;
  font-weight: 700;
  color: white;
  background: #ffae42;
  padding: 2px 6px;
  border-radius: 999px;
}

/* 进化历史 */
.history-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 240px;
  overflow-y: auto;
}

.history-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 8px 12px;
  background: var(--bg);
  border-radius: 8px;
}

.history-rarity {
  width: 4px;
  height: 100%;
  min-height: 20px;
  border-radius: 2px;
  flex-shrink: 0;
}

.history-text {
  font-size: 12px;
  color: var(--text);
  line-height: 1.5;
}

/* 图鉴 */
.collection-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(70px, 1fr));
  gap: 8px;
}

.collection-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 10px 6px;
  background: var(--bg);
  border-radius: 10px;
  opacity: 0.4;
  transition: all 0.2s;
}

.collection-item.discovered {
  opacity: 1;
}

.collection-item.active {
  border: 2px solid var(--accent);
  background: var(--accent-soft);
}

.collection-emoji {
  font-size: 24px;
}

.collection-name {
  font-size: 10px;
  color: var(--muted);
  text-align: center;
}

@media (max-width: 480px) {
  .hero-stats {
    gap: 16px;
  }
  .stat-val {
    font-size: 22px;
  }
  .inventory-grid {
    grid-template-columns: repeat(auto-fill, minmax(70px, 1fr));
  }
}
</style>
