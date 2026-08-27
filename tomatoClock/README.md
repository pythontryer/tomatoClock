# 🎯 专注与习惯面板

一个本地优先的专注计时（番茄钟）+ 习惯打卡 + 数据统计 Web 应用。纯前端，数据存在浏览器 localStorage，无需后端、注册和联网。

## 功能

### 🍅 番茄钟
- 专注 / 短休 / **长休** 三模式，时长均可配置
- **长休息节奏**：每完成 N 个番茄自动进入长休息（N 可设，默认 4）
- **自动开始下一段**（可关闭）：一段结束后自动接续计时
- SVG 进度环，开始 / 暂停 / 重置
- 结束时**桌面通知**（自动申请权限）+ **WebAudio 提示音**（无需音频文件）
- 计时中**标签页标题显示倒计时**（如 `🍅 24:59 专注中`），切走标签页也能看进度
- **键盘快捷键**：`空格` 开始/暂停、`R` 重置
- 可设置每日专注目标（分钟）与每日番茄目标（个）

### ✅ 习惯打卡
- 新增 / 删除 / 重命名习惯，可选颜色
- 每日一键打卡，自动计算 🔥 连续天数
- 拖拽排序（原生 HTML5 Drag & Drop，零依赖）

### 📋 任务（绑定番茄）
- 新增 / 删除任务，勾选完成
- 点任务「绑定」即可把番茄钟关联到该任务
- 每完成一个专注番茄，自动给当前绑定任务 +1 🍅，并在任务上累计显示

### 📊 数据统计
- 今日 KPI：专注分钟、番茄数、习惯完成率
- **周（7 天）/ 月（30 天）视图切换**，专注时长 / 番茄数指标切换
- 虚线**目标线**，达标的柱子自动变绿；柱子带悬浮提示
- 摘要：合计 / 日均 / 达标天数

### 💾 数据备份
- 一键导出 JSON 备份文件
- 导入时严格**格式校验**，支持**覆盖**或**合并**（习惯和专注记录按 id 去重、打卡按天取并集，不丢数据）

### 🌙 其他
- 亮 / 暗色主题一键切换（跟随系统表单控件样式）
- **PWA 可安装 + 离线**：添加到主屏幕像原生 App 一样打开；首次访问后离线可用（Service Worker 运行时缓存）
- 所有数据与设置自动持久化，刷新不丢

## 技术栈

- [Vue 3](https://cn.vuejs.org/)（Composition API + `<script setup>` + **TypeScript**）
- [Vite](https://cn.vitejs.dev/) + `@/` 路径别名
- [Pinia](https://pinia.vuejs.org/) 状态管理（类型安全 + `$subscribe` 自动持久化）
- [Vitest](https://vitest.dev/) + [Vue Test Utils](https://test-utils.vuejs.org/) 单元测试
- [ESLint](https://eslint.org/)（flat config）+ [Prettier](https://prettier.io/) 代码规范
- 除 Pinia 外**零运行时依赖**：拖拽用原生 HTML5 Drag & Drop，提示音用 WebAudio 合成，图表用 SVG/CSS 手绘，PWA 用原生 Service Worker
- 部署：构建产物输出到 `docs/`，由 GitHub Pages 托管（已配 `base: './'` 适配子路径）

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器（自动打开浏览器）
npm run dev

# 类型检查 / 单元测试 / 代码规范
npm run typecheck
npm run test
npm run lint

# 生产构建
npm run build
```

> 注：桌面通知仅在 `localhost` 或 HTTPS 下可用，开发环境天然满足；如部署上线请使用 HTTPS。

## 目录结构

```
├── index.html
├── vite.config.ts            # Vite + Vitest + @ 别名配置
├── tsconfig.json             # 源码类型配置
├── eslint.config.js          # ESLint flat config
├── .prettierrc.json
├── src/
│   ├── main.ts               # 入口（注册 Pinia + 状态持久化订阅）
│   ├── style.css             # 全局样式 + 主题变量（亮/暗）
│   ├── App.vue               # 仪表盘布局 + 主题切换
│   ├── types/
│   │   └── models.ts         # 领域类型（Habit/Task/Session/Settings…）
│   ├── constants/
│   │   └── index.ts          # 默认设置、色板、提示音 profile
│   ├── stores/
│   │   ├── useAppStore.ts    # Pinia 状态 + 领域 actions
│   │   └── persistence.ts    # localStorage 读写 + 默认值合并
│   ├── composables/
│   │   ├── useTimer.ts       # 计时状态机（时间戳锚点）
│   │   ├── useSound.ts       # WebAudio 提示音
│   │   └── useNotification.ts# 桌面通知 + 权限申请
│   ├── components/
│   │   ├── PomodoroTimer.vue # 番茄钟：进度环 + 模式切换
│   │   ├── timer/TimerSettings.vue
│   │   ├── TaskBoard.vue     # 任务：绑定番茄
│   │   ├── HabitList.vue     # 习惯打卡：拖拽排序、连续天数
│   │   ├── StatsPanel.vue    # 统计容器
│   │   ├── stats/            # KPI / 趋势图 / 习惯率 / 任务分布
│   │   └── DataManager.vue   # 数据导出/导入
│   └── utils/
│       ├── date.ts           # 日期工具
│       ├── id.ts             # id 生成
│       └── importExport.ts   # 导入校验/清洗
└── tests/                    # Vitest 单元测试
```

## 数据说明

数据存储在浏览器 localStorage（键：`focus-habit-panel:v1`），包含习惯列表、每日打卡记录、专注会话记录与设置。换设备时用「导出 JSON → 导入 JSON」迁移。
