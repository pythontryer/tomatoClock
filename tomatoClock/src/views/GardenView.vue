<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useAppStore } from '@/stores/useAppStore'
import { useUserStore } from '@/stores/useUserStore'
import { getFocusLevel, getNextLevel } from '@/constants'
import {
  getMyItems, createGiftCode, claimGift, verifyItem, getItemHistory,
  getCompanion, evolveCompanion,
  type CollectibleItem, type CompanionState, type EvolveResult
} from '@/utils/api'

const store = useAppStore()
const userStore = useUserStore()

// ========== 小伙伴（AI进化系统） ==========
const companion = ref<CompanionState | null>(null)
const loadingCompanion = ref(false)
const isEvolving = ref(false)
const evolveResult = ref<EvolveResult | null>(null)
const showEvolveModal = ref(false)

async function loadCompanion() {
  if (!userStore.isLoggedIn) return
  loadingCompanion.value = true
  try {
    companion.value = await getCompanion()
  } catch {
    // 静默失败
  } finally {
    loadingCompanion.value = false
  }
}

async function giveItemToCompanion(item: CollectibleItem) {
  if (!companion.value || isEvolving.value) return
  isEvolving.value = true
  try {
    const result = await evolveCompanion(item.name, item.emoji || '🎁')
    evolveResult.value = result
    showEvolveModal.value = true
    // 刷新小伙伴状态
    await loadCompanion()
    // 刷新藏品列表（道具被消耗了？不，道具不消耗，只是触发进化）
    // 实际上道具应该保留，因为是数字藏品
  } catch (e: unknown) {
    alert((e as Error).message || '进化失败')
  } finally {
    isEvolving.value = false
  }
}

function closeEvolveModal() {
  showEvolveModal.value = false
  evolveResult.value = null
}

// ========== 数字藏品 ==========
const collectibles = ref<CollectibleItem[]>([])
const loadingCollectibles = ref(false)
const giftCode = ref<string | null>(null)
const giftItemName = ref('')
const showClaimModal = ref(false)
const claimCode = ref('')
const claimError = ref('')
const claimSuccess = ref<CollectibleItem | null>(null)

async function loadCollectibles() {
  if (!userStore.isLoggedIn) return
  loadingCollectibles.value = true
  try {
    const res = await getMyItems()
    collectibles.value = res.items
  } catch {
    // 静默失败
  } finally {
    loadingCollectibles.value = false
  }
}

onMounted(() => {
  loadCompanion()
  loadCollectibles()
})

async function handleGift(item: CollectibleItem) {
  try {
    const res = await createGiftCode(item.id)
    giftCode.value = res.code
    giftItemName.value = item.name
    setTimeout(() => loadCollectibles(), 500)
  } catch (e: unknown) {
    alert((e as Error).message || '赠送失败')
  }
}

function copyGiftCode() {
  if (giftCode.value) {
    navigator.clipboard.writeText(giftCode.value)
    alert('兑换码已复制')
  }
}

function closeGiftModal() {
  giftCode.value = null
}

async function handleClaim() {
  claimError.value = ''
  claimSuccess.value = null
  const code = claimCode.value.trim().toUpperCase()
  if (code.length !== 6) {
    claimError.value = '兑换码为6位'
    return
  }
  try {
    const res = await claimGift(code)
    claimSuccess.value = res.item
    claimCode.value = ''
    loadCollectibles()
  } catch (e: unknown) {
    claimError.value = (e as Error).message || '领取失败'
  }
}

function closeClaimModal() {
  showClaimModal.value = false
  claimCode.value = ''
  claimError.value = ''
  claimSuccess.value = null
}

// ========== 道具详情 ==========
const selectedItem = ref<CollectibleItem | null>(null)
const itemHistory = ref<Array<Record<string, unknown>>>([])
const itemVerified = ref<boolean | null>(null)
const loadingDetail = ref(false)

async function openDetail(item: CollectibleItem) {
  selectedItem.value = item
  itemHistory.value = []
  itemVerified.value = null
  loadingDetail.value = true
  try {
    const [historyRes, verifyRes] = await Promise.all([
      getItemHistory(item.id),
      verifyItem(item.id)
    ])
    itemHistory.value = historyRes.transfers
    itemVerified.value = verifyRes.valid
  } catch {
    // 静默失败
  } finally {
    loadingDetail.value = false
  }
}

function closeDetail() {
  selectedItem.value = null
  itemHistory.value = []
  itemVerified.value = null
}

function formatTransferTime(ts: number): string {
  const d = new Date(ts * 1000)
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
}

function formatTime(ts: number): string {
  const d = new Date(ts * 1000)
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
}

// 专注等级
const currentLevel = computed(() => getFocusLevel(store.pomoCycle))
const nextLevel = computed(() => getNextLevel(store.pomoCycle))
const levelProgress = computed(() => {
  if (!nextLevel.value) return 100
  const prev = currentLevel.value.minPomo
  const next = nextLevel.value.minPomo
  return Math.min(100, Math.round(((store.pomoCycle - prev) / (next - prev)) * 100))
})

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
</script>

<template>
  <div class="garden-view">
    <div class="page-header">
      <h1 class="page-title">专注小园</h1>
      <p class="page-subtitle">完成番茄钟获得道具，给小伙伴使用触发奇妙变化</p>
    </div>

    <!-- 小伙伴展示区 -->
    <section class="card companion-hero">
      <div v-if="loadingCompanion" class="companion-loading">
        <div class="loading-spinner"></div>
        <p>加载小伙伴中...</p>
      </div>
      <template v-else-if="companion">
        <!-- 形态展示 -->
        <div class="hero-display">
          <div class="form-emoji-wrap" :class="{ evolving: isEvolving }">
            <video v-if="companion.form.video" :src="companion.form.video" autoplay loop muted playsinline class="form-video" />
            <img v-else-if="companion.form.image" :src="companion.form.image" :alt="companion.form.name" class="form-image" />
            <span v-else class="form-emoji">{{ companion.form.emoji }}</span>
          </div>
          <div class="form-info">
            <div class="form-name-row">
              <span class="form-name">{{ companion.name }}</span>
              <span class="form-evolve-count">已进化 {{ companion.evolve_count }} 次</span>
            </div>
            <div class="form-title">{{ companion.form.name }}</div>
            <div class="form-desc">{{ companion.form.desc }}</div>
          </div>
        </div>

        <!-- 想要的道具 -->
        <div class="wanted-box">
          <span class="wanted-label">💭 现在想要</span>
          <span class="wanted-item">
            {{ companion.wanted.emoji }} {{ companion.wanted.name }}
          </span>
          <span class="wanted-hint">{{ companion.wanted.desc }}</span>
          <span class="wanted-tip">完成番茄钟可能获得它想要的道具~</span>
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
            <div class="stat-val">{{ collectibles.length }}</div>
            <div class="stat-label">藏品数量</div>
          </div>
          <div class="stat">
            <div class="stat-val">{{ companion.evolve_count }}</div>
            <div class="stat-label">进化次数</div>
          </div>
        </div>
      </template>
      <div v-else class="companion-empty">
        <p>登录后即可拥有你的小伙伴~</p>
      </div>
    </section>

    <!-- 数字藏品 -->
    <section class="card collectibles-section">
      <div class="section-header">
        <h2 class="section-title">💎 我的藏品</h2>
        <div class="section-actions">
          <button class="claim-btn" @click="showClaimModal = true">🎁 领取道具</button>
          <button class="refresh-btn" :disabled="loadingCollectibles" @click="loadCollectibles">
            {{ loadingCollectibles ? '加载中...' : '刷新' }}
          </button>
        </div>
      </div>
      <p class="section-desc">每个道具都是独一无二的数字藏品，点击「给它」可让小伙伴进化</p>
      <div v-if="loadingCollectibles" class="empty-state">
        <div class="empty-icon">⏳</div>
        <p>加载中...</p>
      </div>
      <div v-else-if="collectibles.length === 0" class="empty-state">
        <div class="empty-icon">🏺</div>
        <p>还没有藏品</p>
        <p class="empty-sub">完成番茄钟即可获得数字藏品道具</p>
      </div>
      <div v-else class="collectibles-grid">
        <div
          v-for="item in collectibles"
          :key="item.id"
          class="collectible-card"
          :class="'rarity-' + item.rarity"
          @click="openDetail(item)"
        >
          <div class="collectible-image-wrap">
            <img v-if="item.image_url" :src="item.image_url" :alt="item.name" class="collectible-image" />
            <span v-else class="collectible-emoji">{{ item.emoji }}</span>
          </div>
          <div class="collectible-name">{{ item.name }}</div>
          <div class="collectible-rarity" :style="{ color: rarityColor(item.rarity) }">
            {{ rarityLabel(item.rarity) }}
          </div>
          <div class="collectible-id">{{ item.id }}</div>
          <div class="collectible-desc">{{ item.description }}</div>
          <div class="collectible-meta">
            <span>铸造: {{ formatTime(item.minted_at) }}</span>
            <span>流转: {{ item.transfer_count }}次</span>
          </div>
          <div class="collectible-actions">
            <button class="give-btn" :disabled="isEvolving" @click.stop="giveItemToCompanion(item)">
              {{ isEvolving ? '进化中...' : '🌟 给它' }}
            </button>
            <button class="gift-btn" @click.stop="handleGift(item)">赠送</button>
          </div>
        </div>
      </div>
    </section>

    <!-- 进化结果弹窗 -->
    <transition name="fade">
      <div v-if="showEvolveModal && evolveResult" class="modal-overlay" @click.self="closeEvolveModal">
        <div class="modal-card evolve-card">
          <div class="evolve-title">✨ 小伙伴进化了！</div>
          <div class="evolve-animation">
            <div class="evolve-old">
              <span class="evolve-emoji">{{ evolveResult.old_form.emoji }}</span>
              <span class="evolve-name">{{ evolveResult.old_form.name }}</span>
            </div>
            <div class="evolve-arrow">→</div>
            <div class="evolve-new">
              <video v-if="evolveResult.new_form.video" :src="evolveResult.new_form.video" autoplay loop muted playsinline class="evolve-video" />
              <img v-else-if="evolveResult.new_form.image" :src="evolveResult.new_form.image" :alt="evolveResult.new_form.name" class="evolve-image" />
              <span v-else class="evolve-emoji new">{{ evolveResult.new_form.emoji }}</span>
              <span class="evolve-name">{{ evolveResult.new_form.name }}</span>
            </div>
          </div>
          <p class="evolve-reason">{{ evolveResult.reason }}</p>
          <div class="evolve-next">
            <span class="next-label">💭 现在想要</span>
            <span class="next-item">{{ evolveResult.next_item.emoji }} {{ evolveResult.next_item.name }}</span>
            <span class="next-desc">{{ evolveResult.next_item.desc }}</span>
          </div>
          <div v-if="!evolveResult.used_ai" class="evolve-mode">
            <span class="mode-hint">（AI 未配置，使用预设进化路径）</span>
          </div>
          <div class="modal-actions">
            <button class="modal-btn primary" @click="closeEvolveModal">太棒了</button>
          </div>
        </div>
      </div>
    </transition>

    <!-- 赠送码弹窗 -->
    <transition name="fade">
      <div v-if="giftCode" class="modal-overlay" @click.self="closeGiftModal">
        <div class="modal-card">
          <div class="modal-title">🎁 赠送码已生成</div>
          <div class="gift-code-display">{{ giftCode }}</div>
          <p class="gift-desc">把这个6位码发给朋友，对方在「领取道具」中输入即可获得「{{ giftItemName }}」</p>
          <p class="gift-warning">⚠️ 24小时内有效，赠送后道具将从你的藏品中移除</p>
          <div class="modal-actions">
            <button class="modal-btn primary" @click="copyGiftCode">复制兑换码</button>
            <button class="modal-btn" @click="closeGiftModal">关闭</button>
          </div>
        </div>
      </div>
    </transition>

    <!-- 领取弹窗 -->
    <transition name="fade">
      <div v-if="showClaimModal" class="modal-overlay" @click.self="closeClaimModal">
        <div class="modal-card">
          <div class="modal-title">🎁 领取道具</div>
          <template v-if="!claimSuccess">
            <p class="gift-desc">输入朋友给你的6位兑换码，领取数字藏品</p>
            <input
              v-model="claimCode"
              class="claim-input"
              placeholder="输入6位兑换码"
              maxlength="6"
              @keyup.enter="handleClaim"
            />
            <div v-if="claimError" class="form-error">{{ claimError }}</div>
            <div class="modal-actions">
              <button class="modal-btn primary" @click="handleClaim">领取</button>
              <button class="modal-btn" @click="closeClaimModal">取消</button>
            </div>
          </template>
          <template v-else>
            <div class="claim-success">
              <div class="claim-success-emoji">{{ claimSuccess.emoji }}</div>
              <div class="claim-success-name">{{ claimSuccess.name }}</div>
              <div class="claim-success-rarity" :style="{ color: rarityColor(claimSuccess.rarity) }">
                {{ rarityLabel(claimSuccess.rarity) }}
              </div>
              <p>已加入你的藏品！</p>
            </div>
            <div class="modal-actions">
              <button class="modal-btn primary" @click="closeClaimModal">太棒了</button>
            </div>
          </template>
        </div>
      </div>
    </transition>

    <!-- 道具详情弹窗 -->
    <transition name="fade">
      <div v-if="selectedItem" class="modal-overlay" @click.self="closeDetail">
        <div class="modal-card detail-card">
          <button class="detail-close" @click="closeDetail">✕</button>
          <div class="detail-image-wrap" :class="'rarity-' + selectedItem.rarity">
            <img v-if="selectedItem.image_url" :src="selectedItem.image_url" :alt="selectedItem.name" class="detail-image" />
            <span v-else class="detail-emoji">{{ selectedItem.emoji }}</span>
          </div>
          <div class="detail-header">
            <h2 class="detail-name">{{ selectedItem.name }}</h2>
            <span class="detail-rarity" :style="{ background: rarityColor(selectedItem.rarity) }">
              {{ rarityLabel(selectedItem.rarity) }}
            </span>
          </div>
          <div class="detail-verify">
            <span v-if="itemVerified === true" class="verify-ok">✓ 真品验证通过</span>
            <span v-else-if="itemVerified === false" class="verify-fail">✗ 验证失败</span>
            <span v-else class="verify-loading">验证中...</span>
          </div>
          <p class="detail-desc">{{ selectedItem.description }}</p>
          <div class="detail-attrs">
            <div class="attr-item">
              <span class="attr-label">编号</span>
              <span class="attr-value">{{ selectedItem.id }}</span>
            </div>
            <div class="attr-item">
              <span class="attr-label">铸造时间</span>
              <span class="attr-value">{{ formatTransferTime(selectedItem.minted_at) }}</span>
            </div>
            <div class="attr-item">
              <span class="attr-label">流转次数</span>
              <span class="attr-value">{{ selectedItem.transfer_count }} 次</span>
            </div>
          </div>
          <div class="detail-history">
            <h3 class="history-title">📜 流转记录</h3>
            <div v-if="loadingDetail" class="history-loading">加载中...</div>
            <div v-else-if="itemHistory.length === 0" class="history-empty">暂无流转记录</div>
            <div v-else class="history-list">
              <div v-for="(h, idx) in itemHistory" :key="idx" class="history-row">
                <span class="history-time">{{ formatTransferTime(Number(h.created_at)) }}</span>
                <span class="history-action">
                  {{ h.from_user ? (h.from_nick || h.from_user) : '铸造' }}
                  →
                  {{ h.to_nick || h.to_user }}
                </span>
              </div>
            </div>
          </div>
          <div class="modal-actions">
            <button class="modal-btn primary" @click="giveItemToCompanion(selectedItem); closeDetail()">🌟 给小伙伴</button>
            <button class="modal-btn" @click="handleGift(selectedItem); closeDetail()">赠送</button>
            <button class="modal-btn" @click="closeDetail">关闭</button>
          </div>
        </div>
      </div>
    </transition>

    <!-- 进化历史 -->
    <section v-if="companion && companion.history.length > 0" class="card history-section">
      <div class="section-header">
        <h2 class="section-title">📜 进化日志</h2>
      </div>
      <div class="history-list">
        <div
          v-for="entry in companion.history.slice().reverse().slice(0, 10)"
          :key="entry.step"
          class="history-item"
        >
          <span class="history-step">第{{ entry.step }}次</span>
          <span class="history-content">
            {{ entry.from_form }} →（{{ entry.item_used }}）→ {{ entry.to_form }}
          </span>
          <span class="history-reason">{{ entry.reason }}</span>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.garden-view {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
}
.page-header {
  text-align: center;
  margin-bottom: 24px;
}
.page-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--text);
  margin: 0 0 8px;
}
.page-subtitle {
  font-size: 14px;
  color: var(--muted);
  margin: 0;
}
.card {
  background: var(--card);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
}

/* 小伙伴展示区 */
.companion-hero {
  background: linear-gradient(135deg, #e8f5e922, #c8e6c933);
}
.companion-loading, .companion-empty {
  text-align: center;
  padding: 40px 20px;
  color: var(--muted);
}
.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--border);
  border-top-color: #2bbf8a;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
.hero-display {
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 20px;
}
.form-emoji-wrap {
  width: 100px;
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border-radius: 50%;
  box-shadow: 0 4px 16px rgba(0,0,0,0.1);
  flex-shrink: 0;
}
.form-emoji-wrap.evolving {
  animation: pulse 0.6s ease-in-out infinite;
}
@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}
.form-emoji {
  font-size: 56px;
}
.form-image {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
}
.form-video {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
}
.form-info {
  flex: 1;
}
.form-name-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 4px;
}
.form-name {
  font-size: 20px;
  font-weight: 700;
  color: var(--text);
}
.form-evolve-count {
  font-size: 12px;
  color: var(--muted);
  background: var(--bg);
  padding: 2px 8px;
  border-radius: 10px;
}
.form-title {
  font-size: 16px;
  color: #2bbf8a;
  font-weight: 600;
  margin-bottom: 4px;
}
.form-desc {
  font-size: 13px;
  color: var(--muted);
}

/* 想要的道具 */
.wanted-box {
  background: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.wanted-label {
  font-size: 12px;
  color: var(--muted);
}
.wanted-item {
  font-size: 18px;
  font-weight: 600;
  color: var(--text);
}
.wanted-hint {
  font-size: 12px;
  color: var(--muted);
}
.wanted-tip {
  font-size: 11px;
  color: #2bbf8a;
  margin-top: 4px;
}

/* 专注等级 */
.focus-level {
  margin-bottom: 16px;
}
.level-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.level-icon { font-size: 18px; }
.level-name { font-weight: 600; color: var(--text); }
.level-pomo { font-size: 12px; color: var(--muted); margin-left: auto; }
.level-progress-bar {
  height: 8px;
  background: var(--border);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 4px;
}
.level-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #2bbf8a, #1a9d6e);
  border-radius: 4px;
  transition: width 0.3s;
}
.level-progress-text {
  font-size: 11px;
  color: var(--muted);
}
.level-max {
  font-size: 12px;
  color: #2bbf8a;
}

/* 统计 */
.hero-stats {
  display: flex;
  gap: 16px;
}
.stat {
  flex: 1;
  text-align: center;
  background: white;
  border-radius: 10px;
  padding: 12px;
}
.stat-val {
  font-size: 24px;
  font-weight: 700;
  color: var(--text);
}
.stat-label {
  font-size: 11px;
  color: var(--muted);
  margin-top: 2px;
}

/* 藏品列表 */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.section-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text);
  margin: 0;
}
.section-actions {
  display: flex;
  gap: 8px;
}
.claim-btn, .refresh-btn {
  padding: 6px 14px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-size: 13px;
}
.claim-btn {
  background: #2bbf8a;
  color: white;
}
.refresh-btn {
  background: var(--bg);
  color: var(--text);
}
.refresh-btn:disabled {
  opacity: 0.5;
}
.section-desc {
  font-size: 13px;
  color: var(--muted);
  margin: 0 0 16px;
}
.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: var(--muted);
}
.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
}
.empty-sub {
  font-size: 12px;
  margin-top: 4px;
}
.collectibles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 16px;
}
.collectible-card {
  background: var(--bg);
  border-radius: 12px;
  padding: 12px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  border: 2px solid transparent;
}
.collectible-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}
.collectible-card.rarity-common { border-color: #2bbf8a44; }
.collectible-card.rarity-rare { border-color: #9b6bff44; }
.collectible-card.rarity-legendary {
  border-color: #FFD700;
  box-shadow: 0 0 12px rgba(255,215,0,0.3);
}
.collectible-image-wrap {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 8px;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
}
.collectible-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.collectible-emoji {
  font-size: 48px;
}
.collectible-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 2px;
}
.collectible-rarity {
  font-size: 11px;
  font-weight: 600;
}
.collectible-id {
  font-size: 10px;
  color: var(--muted);
  font-family: monospace;
  margin: 2px 0;
}
.collectible-desc {
  font-size: 11px;
  color: var(--muted);
  line-height: 1.4;
  margin-bottom: 8px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.collectible-meta {
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  color: var(--muted);
  margin-bottom: 8px;
}
.collectible-actions {
  display: flex;
  gap: 6px;
}
.give-btn, .gift-btn {
  flex: 1;
  padding: 6px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
}
.give-btn {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
}
.give-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.gift-btn {
  background: var(--card);
  color: var(--text);
  border: 1px solid var(--border);
}

/* 弹窗 */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}
.modal-card {
  background: var(--card);
  border-radius: 16px;
  padding: 24px;
  max-width: 420px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
}
.modal-title {
  font-size: 18px;
  font-weight: 600;
  text-align: center;
  margin-bottom: 16px;
}
.gift-code-display {
  font-size: 32px;
  font-weight: 700;
  text-align: center;
  letter-spacing: 8px;
  color: #2bbf8a;
  background: var(--bg);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  font-family: monospace;
}
.gift-desc {
  font-size: 13px;
  color: var(--muted);
  text-align: center;
  margin-bottom: 8px;
}
.gift-warning {
  font-size: 12px;
  color: #e67e22;
  text-align: center;
  margin-bottom: 16px;
}
.modal-actions {
  display: flex;
  gap: 10px;
  margin-top: 16px;
}
.modal-btn {
  flex: 1;
  padding: 10px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
}
.modal-btn.primary {
  background: #2bbf8a;
  color: white;
}
.modal-btn:not(.primary) {
  background: var(--bg);
  color: var(--text);
}
.claim-input {
  width: 100%;
  padding: 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 18px;
  text-align: center;
  letter-spacing: 4px;
  margin-bottom: 12px;
  box-sizing: border-box;
}
.form-error {
  color: #e74c3c;
  font-size: 13px;
  text-align: center;
  margin-bottom: 8px;
}
.claim-success {
  text-align: center;
  padding: 20px 0;
}
.claim-success-emoji {
  font-size: 64px;
  display: block;
  margin-bottom: 12px;
}
.claim-success-name {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 4px;
}
.claim-success-rarity {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 12px;
}

/* 进化结果弹窗 */
.evolve-card {
  text-align: center;
}
.evolve-title {
  font-size: 20px;
  font-weight: 700;
  color: #9b6bff;
  margin-bottom: 20px;
}
.evolve-animation {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-bottom: 16px;
}
.evolve-old, .evolve-new {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}
.evolve-emoji {
  font-size: 48px;
}
.evolve-emoji.new {
  animation: bounce 0.6s ease;
}
.evolve-image {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  object-fit: cover;
  animation: bounce 0.6s ease;
}
.evolve-video {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  object-fit: cover;
  animation: bounce 0.6s ease;
}
@keyframes bounce {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.3); }
}
.evolve-name {
  font-size: 14px;
  font-weight: 600;
}
.evolve-arrow {
  font-size: 24px;
  color: var(--muted);
}
.evolve-reason {
  font-size: 14px;
  color: var(--text);
  line-height: 1.6;
  margin-bottom: 16px;
  padding: 12px;
  background: var(--bg);
  border-radius: 8px;
}
.evolve-next {
  background: #f3edff;
  border-radius: 10px;
  padding: 12px;
  margin-bottom: 12px;
}
.next-label {
  font-size: 12px;
  color: var(--muted);
  display: block;
  margin-bottom: 4px;
}
.next-item {
  font-size: 16px;
  font-weight: 600;
  color: #9b6bff;
}
.next-desc {
  font-size: 12px;
  color: var(--muted);
  display: block;
  margin-top: 2px;
}
.evolve-mode {
  margin-bottom: 8px;
}
.mode-hint {
  font-size: 11px;
  color: var(--muted);
}

/* 详情弹窗 */
.detail-card {
  max-width: 480px;
  position: relative;
}
.detail-close {
  position: absolute;
  top: 16px;
  right: 16px;
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: var(--muted);
}
.detail-image-wrap {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 16px;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
}
.detail-image-wrap.rarity-legendary {
  box-shadow: 0 0 20px rgba(255,215,0,0.4);
}
.detail-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.detail-emoji {
  font-size: 96px;
}
.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.detail-name {
  font-size: 22px;
  font-weight: 700;
  margin: 0;
}
.detail-rarity {
  padding: 4px 12px;
  border-radius: 12px;
  color: white;
  font-size: 12px;
  font-weight: 600;
}
.detail-verify {
  margin-bottom: 12px;
}
.verify-ok { color: #2bbf8a; font-size: 13px; font-weight: 600; }
.verify-fail { color: #e74c3c; font-size: 13px; }
.verify-loading { color: var(--muted); font-size: 13px; }
.detail-desc {
  font-size: 14px;
  color: var(--muted);
  line-height: 1.6;
  margin-bottom: 16px;
}
.detail-attrs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 16px;
}
.attr-item {
  background: var(--bg);
  padding: 8px 12px;
  border-radius: 8px;
}
.attr-label {
  font-size: 11px;
  color: var(--muted);
  display: block;
}
.attr-value {
  font-size: 13px;
  font-weight: 500;
  font-family: monospace;
}
.detail-history {
  margin-bottom: 16px;
}
.history-title {
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 8px;
}
.history-loading, .history-empty {
  font-size: 13px;
  color: var(--muted);
  padding: 8px 0;
}
.history-list {
  max-height: 150px;
  overflow-y: auto;
}
.history-row {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  padding: 6px 0;
  border-bottom: 1px solid var(--border);
}
.history-time { color: var(--muted); }
.history-action { color: var(--text); }

/* 进化历史 */
.history-section .history-list {
  max-height: none;
}
.history-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid var(--border);
}
.history-step {
  font-size: 12px;
  color: #9b6bff;
  font-weight: 600;
  flex-shrink: 0;
  width: 50px;
}
.history-content {
  font-size: 13px;
  color: var(--text);
  flex: 1;
}
.history-reason {
  font-size: 12px;
  color: var(--muted);
  display: block;
  margin-top: 2px;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
