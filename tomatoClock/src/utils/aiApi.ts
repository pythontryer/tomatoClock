/**
 * AI 后端代理调用
 * 所有大模型请求都走 /api/ 代理，避免前端暴露 API Key
 */

export interface AiItem {
  name: string
  desc: string
  rarity: 'common' | 'rare' | 'legendary'
  emoji: string
  category: string
}

/**
 * 调用后端生成一个随机道具
 * @param category 道具类别偏好
 * @param context 上下文信息（当前形态等）
 */
export async function generateAiItem(
  category: string = 'random',
  context: string = ''
): Promise<AiItem | null> {
  try {
    const resp = await fetch('/api/generate-item', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category, context })
    })
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}))
      throw new Error(err.error || `HTTP ${resp.status}`)
    }
    const data = await resp.json()
    if (data.error) throw new Error(data.error)
    // 校验返回数据
    if (!data.name || !data.emoji) {
      throw new Error('AI 返回数据不完整')
    }
    return {
      name: String(data.name).slice(0, 12),
      desc: String(data.desc || '').slice(0, 60),
      rarity: ['common', 'rare', 'legendary'].includes(data.rarity)
        ? data.rarity
        : 'common',
      emoji: String(data.emoji).slice(0, 4),
      category: String(data.category || category)
    }
  } catch (e) {
    console.warn('AI 生成道具失败:', e)
    return null
  }
}

/**
 * 检查后端 AI 服务是否可用
 */
export async function checkAiHealth(): Promise<{
  ok: boolean
  apiKeyConfigured: boolean
  model: string
}> {
  try {
    const resp = await fetch('/api/health')
    const data = await resp.json()
    return {
      ok: data.status === 'ok',
      apiKeyConfigured: data.api_key_configured === true,
      model: data.model || ''
    }
  } catch {
    return { ok: false, apiKeyConfigured: false, model: '' }
  }
}
