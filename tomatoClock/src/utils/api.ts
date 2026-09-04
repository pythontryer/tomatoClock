/**
 * 后端 API 封装
 * 所有请求自动带 JWT token
 */

const API_BASE = '/api'

function getToken(): string | null {
  return localStorage.getItem('tc_token')
}

export interface ApiResponse {
  ok?: boolean
  error?: string
  [key: string]: unknown
}

export async function apiRequest<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers
  })

  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    throw new Error(data.error || `请求失败 (${res.status})`)
  }

  return data as T
}

// ============ 认证接口 ============

export interface UserInfo {
  id: string
  email: string
  nickname: string
  created_at?: number
  focus_count?: number
  item_count?: number
}

export interface AuthResult {
  token: string
  user: UserInfo
}

export async function register(email: string, password: string, nickname: string, remember = false): Promise<AuthResult> {
  return apiRequest<AuthResult>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, nickname, remember })
  })
}

export async function login(email: string, password: string, remember = false): Promise<AuthResult> {
  return apiRequest<AuthResult>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password, remember })
  })
}

export async function getMe(): Promise<UserInfo> {
  return apiRequest<UserInfo>('/auth/me')
}

// ============ 道具接口 ============

export interface CollectibleItem {
  id: string
  name: string
  emoji: string
  rarity: 'common' | 'rare' | 'legendary'
  description: string
  image_url?: string
  video_url?: string
  signature: string
  minted_at: number
  transfer_count: number
}

export async function generateItem(wanted?: { name: string; emoji: string; desc?: string }): Promise<CollectibleItem> {
  const body = wanted ? { wanted_name: wanted.name, wanted_emoji: wanted.emoji, wanted_desc: wanted.desc } : {}
  return apiRequest<CollectibleItem>('/item/generate', {
    method: 'POST',
    body: JSON.stringify(body)
  })
}

export async function getMyItems(): Promise<{ items: CollectibleItem[] }> {
  return apiRequest<{ items: CollectibleItem[] }>('/item/mine')
}

export async function verifyItem(itemId: string): Promise<{ valid: boolean; item?: CollectibleItem }> {
  return apiRequest<{ valid: boolean; item?: CollectibleItem }>(`/item/verify?id=${encodeURIComponent(itemId)}`)
}

export async function getItemHistory(itemId: string): Promise<{ transfers: Array<Record<string, unknown>> }> {
  return apiRequest<{ transfers: Array<Record<string, unknown>> }>(`/item/history?id=${encodeURIComponent(itemId)}`)
}

// ============ 赠送接口 ============

export interface GiftCodeResult {
  code: string
  expires_in: number
  item_id: string
}

export async function createGiftCode(itemId: string): Promise<GiftCodeResult> {
  return apiRequest<GiftCodeResult>('/gift/create', {
    method: 'POST',
    body: JSON.stringify({ item_id: itemId })
  })
}

export async function claimGift(code: string): Promise<{ item: CollectibleItem }> {
  return apiRequest<{ item: CollectibleItem }>('/gift/claim', {
    method: 'POST',
    body: JSON.stringify({ code })
  })
}

// ============ 小伙伴进化系统 ============

export interface CompanionForm {
  name: string
  emoji: string
  desc: string
  image?: string
  video?: string
}

export interface CompanionState {
  id: string
  name: string
  form: CompanionForm
  wanted: CompanionForm
  evolve_count: number
  history: Array<{
    step: number
    from_form: string
    item_used: string
    to_form: string
    reason: string
    created_at: number
  }>
}

export interface EvolveResult {
  old_form: CompanionForm
  new_form: CompanionForm
  reason: string
  next_item: CompanionForm
  evolve_count: number
  used_ai: boolean
}

export async function getCompanion(): Promise<CompanionState> {
  return apiRequest<CompanionState>('/companion', { method: 'GET' })
}

export async function evolveCompanion(itemName: string, itemEmoji: string): Promise<EvolveResult> {
  return apiRequest<EvolveResult>('/companion/evolve', {
    method: 'POST',
    body: JSON.stringify({ item_name: itemName, item_emoji: itemEmoji })
  })
}
