# AI 接手速览（给下一个 AI）

项目：**专注与习惯面板**（Vue3 + Pinia + Vite，纯前端番茄钟 + 习惯 + 统计）。完整文档见 [`项目交接文档.md`](./项目交接文档.md)，文件职责见 [`文件职责清单.md`](./文件职责清单.md)。

## 30 秒上手
- 工程目录：`E:/WorkBuddyPRJ/软件项目/tomatoClock/`（仓库根是其父目录 `软件项目`，构建产物输出到 `../docs`）。
- 跑起来：`npm install` → `npm run dev`（http://localhost:5173）。
- 验证改动：`npm run typecheck`（必须干净）+ `npm test`（54 项全过）。
- 数据全在浏览器 `localStorage`（键 `focus-habit-panel:v1`），**无后端、无 .env、无密钥**。

## 关键事实（别踩坑）
1. **推送被卡**：曾有泄露的 GitHub PAT（已吊销）+ 网络不稳，`origin/main` 状态 `[gone]`，提交只在本机。**使用新 PAT/SSH 推送。**
2. **改数据模型**：先动 `src/types/models.ts`，再到 `src/constants/index.ts` 的 `SCHEMA_VERSION` **+1**，并在 `src/utils/normalize.ts` 的 `defaultX/normalizeX` 与 `src/stores/persistence.ts` 的 `withDefaults` 补齐默认/迁移。否则老用户数据缺字段。
3. **改状态**：所有写操作走 `src/stores/useAppStore.ts` 的 action；持久化由 `main.ts` 的 `$subscribe(deep)` 自动写 localStorage，无需手动存。
4. **路径别名** `@` → `src/`（vite + tsconfig 同步配置）。
5. **测试环境** jsdom；纯逻辑（计时/习惯）已抽到 `composables/timerLogic.ts` 与 `utils/habit.ts` 便于单测。
6. **PWA**：`public/sw.js` + `manifest.webmanifest`；SW 仅在 `import.meta.env.PROD` 注册。
7. **构建** `npm run build` 会 `rm -rf ../docs` 后输出——这是设计行为，别在错误目录执行。

## 常见任务怎么做
- **加一个设置项**：`models.ts` 的 `Settings` 加字段 → `constants` 的 `DEFAULT_SETTINGS` 加默认 → 在 `TimerSettings.vue` 或 `CompanionShop.vue` 加 UI（`v-model="store.settings.xxx"`，Pinia 状态可直接双向绑定）。
- **加一个统计图表**：新建 `src/components/stats/Xxx.vue`，在 `src/components/StatsPanel.vue` 中 import 并放入模板 `<section class="card stats">` 内（注意 `.stats-cell` 在 `App.vue` 里是整行宽度）。
- **加一种植物/庆祝皮肤**：在 `constants/index.ts` 的 `PLANT_FORMS`/`CELEBRATIONS` 加条目（`cost` 为露珠价）；若需新造型，扩展 `Companion.vue` 的 SVG 分支。
- **改专注/休息节奏逻辑**：看 `composables/timerLogic.ts`（纯函数）与 `useTimer.ts`（状态机）。
- **导入/导出新字段**：`utils/importExport.ts` 的 `sanitize()` + `utils/normalize.ts` 同步处理，保持字段级容错。

## 当前已完成 / 已知限制（详见主文档 §6、§7）
- 已完成：番茄钟、习惯（含频率/连续/提醒）、任务（绑定番茄/预估）、8 个统计图表、专注小园（植物成长+露珠奖励）、数据迁移/PWA/无障碍、54 测试通过。
- 限制：无云同步（仅本机+JSON 导入导出）、通知在 iframe 被拦、陪伴内容偏少、统计组件缺单测、国际化缺失。

## 不要碰的东西
- `E:/WorkBuddyPRJ/软件项目/.workbuddy/`：项目记忆，非临时缓存，**勿删**。
- 泄露的 PAT 不要写进任何文件/commit。
- `../docs/` 是构建产物，本地开发不必手动改；改源码后重新 `npm run build` 即可。
