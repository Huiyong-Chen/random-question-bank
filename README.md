# random-question-bank

本地随机题库，支持导入和导出。

## 项目架构

### 技术栈

- **React 19.2.0** + **TypeScript 5.9.3** + **Vite 7.2.4**
- **严格 ESM 模式**：`package.json` 设置 `type: module`，配置文件使用 `.mts/.mjs`
- **Tailwind CSS**（待集成）

### 代码规范

- **ESLint**：使用 `eslint.config.mjs`（ESM 格式）
- **Prettier**：使用 `.prettierrc` 配置
- **TypeScript**：严格模式，启用所有类型检查
- **导入排序**：使用 `eslint-plugin-simple-import-sort` 自动排序

### 目录结构

```
src/
├── components/     # 可复用组件
├── pages/         # 页面组件
├── hooks/         # 自定义 Hooks
├── services/      # API/服务层（预留）
├── types/         # TypeScript 类型定义
├── utils/         # 工具函数
├── i18n/          # 国际化资源
└── styles/        # 样式文件（预留）
```

### 路径别名

在 `tsconfig.app.json` 和 `vite.config.mts` 中配置：

- `@components/*` → `src/components/*`
- `@hooks/*` → `src/hooks/*`
- `@pages/*` → `src/pages/*`
- `@services/*` → `src/services/*`
- `@/types/*` → `src/types/*`（使用 `@/types` 避免与 TypeScript 类型声明包冲突）
- `@utils/*` → `src/utils/*`
- `@i18n/*` → `src/i18n/*`

### 开发脚本

```bash
# 开发
pnpm dev

# 构建
pnpm build

# 类型检查
pnpm typecheck

# 代码检查
pnpm lint
pnpm lint:fix

# 代码格式化
pnpm format
pnpm format:write

# 构建分析
pnpm analyze

# Storybook
pnpm storybook
pnpm storybook:build
```

### Git Hooks

使用 **Husky** + **lint-staged** 在提交前自动：
- 运行 ESLint 修复
- 运行 Prettier 格式化
- 运行 TypeScript 类型检查

### 性能优化

- **代码分割**：路由级懒加载（`React.lazy` + `Suspense`）
- **分包策略**：Vite `manualChunks` 抽离 `react`、`docx` 等大型依赖
- **构建分析**：使用 `rollup-plugin-visualizer` 生成 `dist/stats.html`

### 环境变量

所有环境变量必须以 `VITE_` 前缀开头，参考 `.env.example`。

### Storybook

组件开发使用 Storybook，配置文件位于 `.storybook/`：
- `main.mts`：Storybook 主配置（ESM）
- `preview.mts`：全局预览配置（ESM）

### 配置文件说明

所有 Node.js 侧配置文件使用 ESM 格式：
- `vite.config.mts` - Vite 构建配置
- `eslint.config.mjs` - ESLint 配置
- `lint-staged.config.mjs` - lint-staged 配置
- `.storybook/main.mts` - Storybook 主配置
- `.storybook/preview.mts` - Storybook 预览配置
