# 贡献指南 (Contributing)

感谢你有兴趣为本项目做贡献！这是一个本地优先的专注与习惯面板，欢迎提交 issue、PR 或改进建议。

## 开发环境

- Node.js 22+
- npm

```bash
# 克隆仓库
git clone https://github.com/pythontryer/tomatoClock.git
cd tomatoClock/tomatoClock

# 安装依赖
npm install

# 启动开发服务器（localhost:5173）
npm run dev
```

> 源码位于 `tomatoClock/` 子目录（根目录 `docs/` 是构建产物，用于 GitHub Pages 部署）。

## 开发流程

提交 PR 前，请确保以下检查全部通过：

```bash
npm run typecheck   # TypeScript 类型检查
npm run test        # Vitest 单元测试（48 用例）
npm run lint        # ESLint 代码规范
npm run build       # 生产构建
```

## 代码风格

- 使用 TypeScript，严格模式；类型集中在 `src/types/models.ts`
- 组件使用 Composition API + `<script setup lang="ts">`
- 领域逻辑收敛在 Pinia store（`src/stores/`）与 composables（`src/composables/`）
- 使用 `@/` 路径别名，避免相对路径 `../`
- 提交信息遵循 [Conventional Commits](https://www.conventionalcommits.org/)：`feat:` / `fix:` / `chore:` / `refactor:` / `docs:` 前缀

## 目录结构

```
tomatoClock/
├── src/
│   ├── main.ts              # 入口
│   ├── App.vue              # 仪表盘布局
│   ├── types/               # 领域类型
│   ├── constants/           # 默认设置 / 常量
│   ├── stores/              # Pinia 状态 + 持久化
│   ├── composables/         # useTimer / useSound / useNotification 等
│   ├── components/          # 界面组件
│   └── utils/               # 工具函数
└── tests/                   # Vitest 测试
```

## 提交流程

1. Fork 本仓库
2. 创建特性分支：`git checkout -b feat/your-feature`
3. 提交变更（遵循 Conventional Commits）
4. 推送分支并发起 Pull Request
5. 等待 CI（typecheck / test / lint / build）通过与 review

## 行为准则

请保持友善、尊重他人。欢迎任何形式的贡献：修 bug、加功能、改进文档、补测试。
