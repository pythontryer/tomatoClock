/**
 * 进化系统：道具 + 随机形态变化
 *
 * 设计理念：
 * - 每完成一个番茄钟获得一个随机道具
 * - 当前形态有"想要的道具"，给它后触发随机变化
 * - 变化结果由加权随机生成（模拟大模型的概率分布）
 * - 形态之间可以跨类别进化（植物→机器人→精灵→...）
 * - 统一用 emoji 视觉，可爱讨人喜欢
 */

// ---------- 道具定义 ----------

export interface EvolutionItem {
  id: string
  name: string
  emoji: string
  /** 稀有度：common / rare / legendary */
  rarity: 'common' | 'rare' | 'legendary'
  /** 描述 */
  desc: string
}

export const EVOLUTION_ITEMS: EvolutionItem[] = [
  // 植物类
  { id: 'water', name: '水滴', emoji: '💧', rarity: 'common', desc: '清澈的露珠，植物的最爱' },
  { id: 'sunlight', name: '阳光', emoji: '☀️', rarity: 'common', desc: '温暖的阳光，带来能量' },
  { id: 'fertilizer', name: '肥料', emoji: '🌱', rarity: 'common', desc: '营养丰富，促进生长' },
  { id: 'rainbow', name: '彩虹', emoji: '🌈', rarity: 'rare', desc: '雨后的彩虹，蕴含魔力' },
  // 机器人类
  { id: 'battery', name: '电池', emoji: '🔋', rarity: 'common', desc: '充满能量的电池' },
  { id: 'gear', name: '齿轮', emoji: '⚙️', rarity: 'common', desc: '精密的齿轮零件' },
  { id: 'chip', name: '数据芯片', emoji: '💾', rarity: 'rare', desc: '存储着未知数据的芯片' },
  { id: 'circuit', name: '电路板', emoji: '🔌', rarity: 'common', desc: '复杂的电路模块' },
  // 通用/魔法类
  { id: 'star', name: '星星', emoji: '⭐', rarity: 'rare', desc: '坠落的星星碎片' },
  { id: 'heart', name: '爱心', emoji: '❤️', rarity: 'common', desc: '充满温暖的爱心' },
  { id: 'music', name: '音符', emoji: '🎵', rarity: 'common', desc: '美妙的旋律' },
  { id: 'crystal', name: '水晶', emoji: '💎', rarity: 'legendary', desc: '闪耀的魔法水晶' },
  { id: 'moon', name: '月光', emoji: '🌙', rarity: 'rare', desc: '柔和的月光精华' },
  { id: 'fire', name: '火焰', emoji: '🔥', rarity: 'rare', desc: '跳动的火焰精灵' },
  { id: 'ice', name: '冰晶', emoji: '❄️', rarity: 'rare', desc: '永不融化的冰晶' },
  // 食物类
  { id: 'honey', name: '蜂蜜', emoji: '🍯', rarity: 'common', desc: '甜甜的蜂蜜' },
  { id: 'fish', name: '小鱼', emoji: '🐟', rarity: 'common', desc: '新鲜的小鱼' },
  { id: 'carrot', name: '胡萝卜', emoji: '🥕', rarity: 'common', desc: '脆甜的胡萝卜' },
  { id: 'cake', name: '蛋糕', emoji: '🍰', rarity: 'rare', desc: '美味的小蛋糕' },
  { id: 'tea', name: '茶', emoji: '🍵', rarity: 'common', desc: '清香的茶' }
]

/** 按稀有度权重抽取道具（完成番茄钟时调用） */
export function rollItem(): EvolutionItem {
  const weights: Record<string, number> = { common: 70, rare: 25, legendary: 5 }
  const pool = EVOLUTION_ITEMS.flatMap((item) =>
    Array(weights[item.rarity]).fill(item)
  )
  return pool[Math.floor(Math.random() * pool.length)]
}

// ---------- 形态定义 ----------

export interface EvolutionForm {
  id: string
  name: string
  emoji: string
  /** 形态类别：plant / robot / spirit / animal / element / myth */
  category: 'plant' | 'robot' | 'spirit' | 'animal' | 'element' | 'myth'
  /** 稀有度 */
  rarity: 'common' | 'rare' | 'legendary'
  /** 喜欢的道具 id 列表（给这些道具触发变化的概率更高） */
  likes: string[]
  /** 背景渐变色 */
  bgFrom: string
  bgTo: string
  /** 描述 */
  desc: string
}

export const EVOLUTION_FORMS: EvolutionForm[] = [
  // 植物类
  { id: 'seed', name: '种子', emoji: '🌰', category: 'plant', rarity: 'common', likes: ['water', 'fertilizer'], bgFrom: '#8B7355', bgTo: '#A0826D', desc: '一颗沉睡的种子' },
  { id: 'sprout', name: '嫩芽', emoji: '🌱', category: 'plant', rarity: 'common', likes: ['water', 'sunlight'], bgFrom: '#90EE90', bgTo: '#98FB98', desc: '刚破土的嫩芽' },
  { id: 'sapling', name: '小树', emoji: '🌳', category: 'plant', rarity: 'common', likes: ['water', 'sunlight', 'fertilizer'], bgFrom: '#228B22', bgTo: '#32CD32', desc: '茁壮成长的小树' },
  { id: 'flower', name: '花精灵', emoji: '🌸', category: 'plant', rarity: 'rare', likes: ['sunlight', 'water', 'rainbow'], bgFrom: '#FFB6C1', bgTo: '#FFC0CB', desc: '绽放的花之精灵' },
  { id: 'sunflower', name: '向日葵', emoji: '🌻', category: 'plant', rarity: 'common', likes: ['sunlight'], bgFrom: '#FFD700', bgTo: '#FFA500', desc: '永远追随阳光' },
  { id: 'mushroom', name: '蘑菇精', emoji: '🍄', category: 'plant', rarity: 'rare', likes: ['water', 'fertilizer'], bgFrom: '#CD5C5C', bgTo: '#F08080', desc: '森林里的小蘑菇' },
  { id: 'cactus', name: '仙人掌', emoji: '🌵', category: 'plant', rarity: 'common', likes: ['sunlight', 'water'], bgFrom: '#3CB371', bgTo: '#66CDAA', desc: '坚强的沙漠居民' },
  { id: 'sakura', name: '樱花树', emoji: '🌸', category: 'plant', rarity: 'legendary', likes: ['rainbow', 'moon', 'heart'], bgFrom: '#FFB7C5', bgTo: '#FFCFF1', desc: '传说中的樱花精灵' },
  // 机器人类
  { id: 'robot', name: '小机器人', emoji: '🤖', category: 'robot', rarity: 'common', likes: ['battery', 'gear', 'circuit'], bgFrom: '#708090', bgTo: '#A9A9A9', desc: '刚启动的小机器人' },
  { id: 'fembot', name: '女性机器人', emoji: '👩‍🔬', category: 'robot', rarity: 'rare', likes: ['chip', 'battery', 'heart'], bgFrom: '#DDA0DD', bgTo: '#EE82EE', desc: '温柔的女性机器人' },
  { id: 'robot_princess', name: '机器人公主', emoji: '👸', category: 'robot', rarity: 'legendary', likes: ['crystal', 'heart', 'star'], bgFrom: '#FFD700', bgTo: '#FFB6C1', desc: '机械王国的公主' },
  { id: 'mecha', name: '机甲战士', emoji: '🦾', category: 'robot', rarity: 'rare', likes: ['gear', 'chip', 'fire'], bgFrom: '#4682B4', bgTo: '#5F9EA0', desc: '强大的机甲战士' },
  // 精灵类
  { id: 'fairy', name: '小精灵', emoji: '🧚', category: 'spirit', rarity: 'rare', likes: ['star', 'moon', 'crystal'], bgFrom: '#E6E6FA', bgTo: '#DDA0DD', desc: '闪闪发光的小精灵' },
  { id: 'ghost', name: '小幽灵', emoji: '👻', category: 'spirit', rarity: 'common', likes: ['moon', 'dark'], bgFrom: '#F5F5F5', bgTo: '#E8E8E8', desc: '害羞的小幽灵' },
  { id: 'angel', name: '小天使', emoji: '👼', category: 'spirit', rarity: 'legendary', likes: ['heart', 'star', 'crystal'], bgFrom: '#FFFACD', bgTo: '#FFE4B5', desc: '降临人间的小天使' },
  { id: 'mermaid', name: '人鱼', emoji: '🧜', category: 'spirit', rarity: 'rare', likes: ['water', 'fish', 'crystal'], bgFrom: '#00CED1', bgTo: '#48D1CC', desc: '深海的人鱼公主' },
  // 动物类
  { id: 'cat', name: '小猫', emoji: '🐱', category: 'animal', rarity: 'common', likes: ['fish', 'honey'], bgFrom: '#FFA07A', bgTo: '#FFB347', desc: '慵懒的小猫咪' },
  { id: 'rabbit', name: '小兔子', emoji: '🐰', category: 'animal', rarity: 'common', likes: ['carrot', 'heart'], bgFrom: '#FFC0CB', bgTo: '#FFB6C1', desc: '蹦蹦跳跳的兔子' },
  { id: 'bear', name: '小熊', emoji: '🐻', category: 'animal', rarity: 'common', likes: ['honey', 'cake'], bgFrom: '#DEB887', bgTo: '#D2B48C', desc: '爱吃蜂蜜的小熊' },
  { id: 'fox', name: '小狐狸', emoji: '🦊', category: 'animal', rarity: 'rare', likes: ['fire', 'star'], bgFrom: '#FF7F50', bgTo: '#FF6347', desc: '机灵的小狐狸' },
  { id: 'unicorn', name: '独角兽', emoji: '🦄', category: 'animal', rarity: 'legendary', likes: ['rainbow', 'crystal', 'star'], bgFrom: '#FFB6C1', bgTo: '#DDA0DD', desc: '梦幻的独角兽' },
  // 元素类
  { id: 'sun', name: '小太阳', emoji: '☀️', category: 'element', rarity: 'rare', likes: ['fire', 'star', 'sunlight'], bgFrom: '#FFD700', bgTo: '#FFA500', desc: '温暖的小太阳' },
  { id: 'moon_spirit', name: '月亮精灵', emoji: '🌙', category: 'element', rarity: 'rare', likes: ['moon', 'star', 'crystal'], bgFrom: '#B0C4DE', bgTo: '#778899', desc: '夜空中的月亮' },
  { id: 'star_person', name: '星星人', emoji: '⭐', category: 'element', rarity: 'common', likes: ['star', 'moon'], bgFrom: '#FFE4B5', bgTo: '#FFDAB9', desc: '来自星空的访客' },
  { id: 'fire_spirit', name: '火精灵', emoji: '🔥', category: 'element', rarity: 'rare', likes: ['fire', 'sunlight'], bgFrom: '#FF4500', bgTo: '#FF6347', desc: '热情的火精灵' },
  { id: 'ice_spirit', name: '雪精灵', emoji: '❄️', category: 'element', rarity: 'rare', likes: ['ice', 'moon'], bgFrom: '#E0FFFF', bgTo: '#B0E0E6', desc: '清冷的雪精灵' },
  { id: 'rainbow_spirit', name: '彩虹精灵', emoji: '🌈', category: 'element', rarity: 'legendary', likes: ['rainbow', 'crystal', 'heart'], bgFrom: '#FFB6C1', bgTo: '#87CEEB', desc: '七彩的彩虹精灵' },
  // 神话类
  { id: 'dragon', name: '小龙', emoji: '🐉', category: 'myth', rarity: 'legendary', likes: ['fire', 'crystal', 'star'], bgFrom: '#228B22', bgTo: '#32CD32', desc: '东方的神龙' },
  { id: 'phoenix', name: '凤凰', emoji: '🐦‍🔥', category: 'myth', rarity: 'legendary', likes: ['fire', 'sun', 'crystal'], bgFrom: '#FF4500', bgTo: '#FFD700', desc: '浴火重生的凤凰' }
]

/** 默认起始形态 */
export const DEFAULT_FORM = EVOLUTION_FORMS.find((f) => f.id === 'sprout')!

// ---------- 变化结果 ----------

export type EvolutionResultType = 'transform' | 'decorate' | 'rename' | 'nothing' | 'levelup'

export interface EvolutionResult {
  type: EvolutionResultType
  /** 变化后的新形态（transform 时） */
  newForm?: EvolutionForm
  /** 获得的装饰（decorate 时） */
  decoration?: string
  /** 新名字（rename 时） */
  newName?: string
  /** 变化描述文本 */
  message: string
  /** 稀有度 */
  rarity: 'common' | 'rare' | 'legendary'
}

/** 装饰列表 */
const DECORATIONS = [
  { emoji: '🎩', name: '礼帽' },
  { emoji: '👑', name: '皇冠' },
  { emoji: '🎀', name: '蝴蝶结' },
  { emoji: '🕶️', name: '墨镜' },
  { emoji: '🧣', name: '围巾' },
  { emoji: '🎒', name: '背包' },
  { emoji: '💐', name: '花束' },
  { emoji: '🎈', name: '气球' },
  { emoji: '🪄', name: '魔法棒' },
  { emoji: '🛡️', name: '盾牌' }
]

/** 随机名字库 */
const RANDOM_NAMES = [
  '小绿', '小花', '阿树', '豆豆', '糖糖', '果果', '星星', '月月',
  '暖暖', '冰冰', '火火', '风风', '雷雷', '电电', '水水', '木木',
  '金金', '土土', '萌萌', '呆呆', '酷酷', '帅帅', '美美', '丽丽',
  '奇奇', '妙妙', '欢欢', '乐乐', '平平', '安安', '康康', '健健'
]

/**
 * 大模型风格的变化生成器
 *
 * 模拟大模型的概率分布：
 * - 给喜欢的道具 → 变化概率高，可能跨类别进化
 * - 给不喜欢的道具 → 变化概率低，可能什么都不发生
 * - 稀有道具 → 更容易触发稀有/传说变化
 * - 上下文感知：当前形态类别影响可能的变化方向
 */
export function generateEvolution(
  currentForm: EvolutionForm,
  item: EvolutionItem,
  currentName: string
): EvolutionResult {
  const isLiked = currentForm.likes.includes(item.id)
  const itemRarityWeight = item.rarity === 'legendary' ? 3 : item.rarity === 'rare' ? 2 : 1

  // 基础变化概率：喜欢的道具 85%，不喜欢 40%
  const changeChance = isLiked ? 0.85 : 0.4
  if (Math.random() > changeChance) {
    return {
      type: 'nothing',
      message: `${currentForm.emoji} ${currentName} 似乎对 ${item.emoji} ${item.name} 不感兴趣，什么都没发生...`,
      rarity: 'common'
    }
  }

  // 决定变化类型
  const roll = Math.random() * 100
  let resultType: EvolutionResultType
  if (roll < 50) {
    resultType = 'transform' // 50% 形态变化
  } else if (roll < 75) {
    resultType = 'decorate' // 25% 获得装饰
  } else if (roll < 90) {
    resultType = 'rename' // 15% 改名
  } else {
    resultType = 'levelup' // 10% 特殊升级
  }

  if (resultType === 'transform' || resultType === 'levelup') {
    // 选择新形态：加权随机，稀有道具更容易出稀有形态
    const formPool = EVOLUTION_FORMS.filter((f) => f.id !== currentForm.id)
    const weighted = formPool.flatMap((f) => {
      let w = 1
      if (f.rarity === 'rare') w = 2
      if (f.rarity === 'legendary') w = 0.5
      // 喜欢的道具 + 同类别 → 权重更高
      if (isLiked && f.category === currentForm.category) w *= 2
      // 稀有道具 → 稀有形态权重提升
      if (itemRarityWeight >= 2 && f.rarity !== 'common') w *= itemRarityWeight
      // levelup → 稀有形态权重大幅提升
      if (resultType === 'levelup' && f.rarity !== 'common') w *= 3
      return Array(Math.max(1, Math.round(w))).fill(f)
    })
    const newForm = weighted[Math.floor(Math.random() * weighted.length)]

    const messages = [
      `${item.emoji} 一道光芒闪过，${currentName} 变成了 ${newForm.emoji} ${newForm.name}！`,
      `${currentForm.emoji} ${currentName} 吸收了 ${item.name}的力量，进化为 ${newForm.emoji} ${newForm.name}！`,
      `不可思议！${currentName} 在 ${item.emoji} 的影响下变成了 ${newForm.emoji} ${newForm.name}！`,
      `${newForm.emoji} ${newForm.name} 诞生了！这是 ${item.name}带来的奇迹~`
    ]

    return {
      type: resultType,
      newForm,
      message: messages[Math.floor(Math.random() * messages.length)],
      rarity: newForm.rarity
    }
  }

  if (resultType === 'decorate') {
    const deco = DECORATIONS[Math.floor(Math.random() * DECORATIONS.length)]
    return {
      type: 'decorate',
      decoration: deco.emoji,
      message: `${currentForm.emoji} ${currentName} 获得了 ${deco.emoji} ${deco.name}，看起来更可爱了！`,
      rarity: 'common'
    }
  }

  // rename
  const newName = RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)]
  return {
    type: 'rename',
    newName,
    message: `${currentForm.emoji} ${currentName} 改名为 ${newName} 了！它似乎很喜欢这个名字~`,
    rarity: 'common'
  }
}

/** 根据当前形态生成"想要的道具"提示 */
export function getWantedItem(form: EvolutionForm): EvolutionItem {
  // 70% 概率选喜欢的道具，30% 随机
  if (Math.random() < 0.7 && form.likes.length > 0) {
    const liked = EVOLUTION_ITEMS.filter((i) => form.likes.includes(i.id))
    return liked[Math.floor(Math.random() * liked.length)]
  }
  return rollItem()
}
