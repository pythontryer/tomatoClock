# Changelog

本项目所有值得注意的变更都会记录在此文件。格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，版本号遵循语义化版本。

## [Unreleased]

### Added
- **习惯自定义频率**：每天 / 每周 N 天 / 指定星期，连续天数频率感知（跳过非打卡日不打断 🔥）
- **任务预估**：为任务设定目标番茄数，直观对比实际 vs 预估
- **专注热力图**：GitHub 风格，近 14 周按天着色
- **意图 + 复盘**：专注前填写意图，完成后 1–5 星 + 备注复盘，可回看/补评
- **习惯提醒**：应用内 Toast + 桌面通知，同日仅一次
- **屏幕常亮**：专注时申请 Wake Lock，暂停/切页自动释放
- **PWA 增强**：静态资源缓存优先（stale-while-revalidate）、manifest 增强
- **无障碍**：焦点环、`aria-*` 标签、`prefers-reduced-motion`

### Changed
- **TypeScript + Pinia 全量重构**：JS → TS，手写 store → Pinia，抽离 useTimer/useSound/useNotification 等 composable
- **数据 schema 版本化**：`version` 字段，老备份自动归一化迁移、损坏串自动备份回退
- **工程化**：引入 Vitest（48 用例）、ESLint（flat config）、Prettier、`@/` 路径别名

### Fixed
- 数据导入字段级校验与冲突合并（缺字段/非法值不再整文件失败）
- 提示音不响、通知权限在 iframe 中卡「申请中」

## [1.0.0] - 2026-08-26

### Added
- 番茄钟（专注/短休/长休三模式、长休息节奏、自动接续、SVG 进度环、桌面通知、多套提示音、标题倒计时、键盘快捷键、每日目标）
- 习惯打卡（增删改、颜色、拖拽排序、连续天数）
- 任务系统（任务绑定番茄、完成 +1 🍅）
- 数据统计（今日 KPI、周/月趋势 + 目标线、番茄按任务分布、习惯完成率）
- 数据备份（导出 JSON、导入校验 + 覆盖/合并）
- 亮/暗色主题、PWA 可安装 + 离线、补记专注
