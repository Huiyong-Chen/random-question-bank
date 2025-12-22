# 项目工程化搭建流程（架构师视角）

以下按“问题 → 选择/配置 → 解决的痛点/效果”给出完整流程，涵盖本项目已采用的所有工程化工具与配置（不含框架/组件库选择）。

## 1) 为什么 `package.json` 要 `type: "module"`？
- 痛点：Node 侧配置与脚本需要统一 ESM 语义，避免 CJS/ESM 混用带来的解析歧义。
- 手段：`package.json` 设置 `"type": "module"`，所有工具配置改为 `.mts/.mjs`（如 `vite.config.mts`, `eslint.config.mjs`, `lint-staged.config.mjs`, `.storybook/*.mts`）。
- 效果：Node 与打包链路保持一致的 ESM 解析，不再需要 `require`/`__dirname` 兼容垫片。

## 2) 为什么区分 `tsconfig.app.json` 与 `tsconfig.node.json`？关键配置是什么？
- 痛点：应用代码与工具配置的解析环境不同（浏览器 vs Node），若共用一个 tsconfig 容易产生类型/解析冲突。
- 手段：
  - `tsconfig.app.json`（应用）：`strict`、`moduleResolution: "bundler"`、`verbatimModuleSyntax: true`、`allowImportingTsExtensions: true`、`moduleDetection: "force"`、`jsx: "react-jsx"`，别名 `@components/@hooks/@pages/@services/@/types/@utils/@i18n`。
  - `tsconfig.node.json`（工具/配置）：面向 Node/构建脚本，保持 ESM 与 bundler 解析一致，包含上述配置并收录 `vite.config.mts`、`eslint.config.mjs`、`lint-staged.config.mjs`、`.storybook/**/*.mts`。
- 效果：前端代码使用浏览器语境的 bundler 解析；工具链文件使用 Node 语境，互不干扰，类型检查更精准。

## 3) Vite 配置项作用？解决了哪些问题？
- 痛点：需要快速开发、可控分包与体积可视化。
- 手段（`vite.config.mts`）：
  - 别名与 TS 对齐：`@components/@hooks/@pages/@services/@/types/@utils/@i18n`。
  - 分包：`manualChunks` 抽离 `react`、`docx`，降低主包体积、提升缓存命中。
  - 构建目标/警告：`build.target: "es2022"`，`chunkSizeWarningLimit: 600`，避免低版本产物与过度警告。
  - 体积分析：`ANALYZE=true pnpm analyze` 触发 `rollup-plugin-visualizer` 生成 `dist/stats.html`。
  - 懒加载实践：`ImportPage` 使用 `React.lazy` + `Suspense`（在应用层），示范路由级代码分割。
- 效果：更快的 HMR/构建反馈，清晰的依赖拆分与可视化，首屏体积可控。

## 4) lint-staged 有何作用？
- 痛点：提交包含未格式化/未修复的局部改动，易污染代码库。
- 手段：`lint-staged.config.mjs` 对暂存区文件执行 `eslint --fix` 与 `prettier --write`（含 TS/JS/CSS/JSON/MD），在 Husky pre-commit 中调用。
- 效果：只处理变更文件，提交前自动修复格式与常见问题，减少人工成本。

## 5) ESLint 的作用及插件选择原因？
- 痛点：类型安全之外，还需约束导入顺序、Hooks 规范与开发时热更安全。
- 手段：`eslint.config.mjs`（flat config）
  - `typescript-eslint`：TS 语法与类型感知规则。
  - `simple-import-sort`：自动排序 imports/exports，保持一致性。
  - `eslint-plugin-react-hooks`：保证 Hooks 规则正确。
  - `eslint-plugin-react-refresh`：配合 Vite HMR，避免无效刷新。
  - `eslint-config-prettier`：关闭与 Prettier 冲突的格式规则。
- 效果：统一导入顺序、提升可读性，减少 Hook 误用与热更异常。

## 6) Prettier 的作用？
- 痛点：团队格式不一致导致 diff 噪音大。
- 手段：`.prettierrc` 设定行宽/引号/分号/尾逗号等；`.prettierignore` 排除构建产物与锁文件。
- 效果：一致的自动格式化，降低评审与合并冲突。

## 7) `.env.example` 的作用？
- 痛点：环境变量易遗漏或命名不统一。
- 手段：提供模板 `.env.example`，所有变量必须 `VITE_` 前缀，示例 `VITE_APP_TITLE`/`VITE_API_BASE_URL`/`VITE_DEV_MODE`。
- 效果：可复制的环境基线，防止后端敏感变量混入前端；Vite 仅暴露 `VITE_` 前缀。

## 8) `vite-env.d.ts` 的作用？
- 痛点：直接导入样式或静态资源时，TS 缺少模块声明。
- 手段：在 `src/vite-env.d.ts` 声明 `vite/client`，并为 `*.css` 添加模块声明。
- 效果：避免编译期类型缺失，增强编辑器提示。

## 9) Storybook 的作用？
- 痛点：需要组件级开发/演示/回归，不应依赖主应用路由。
- 手段：`.storybook/main.mts`（ESM、别名与 Vite 同步、禁用 telemetry）、`.storybook/preview.mts`（全局样式、actions/controls），示例故事 `RatioSettings.stories.tsx`。
- 效果：组件可独立预览与交互，促进 UI 迭代与视觉回归，且与应用类型检查解耦。

## 10) Husky 的作用？
- 痛点：团队容易跳过本地质量检查。
- 手段：`.husky/pre-commit` 调用 `lint-staged` 与 `pnpm typecheck`，确保提交前即刻校验。
- 效果：把质量门槛前置到提交环节，减少低质量变更进入仓库。

## 11) TypeScript 路径别名为何使用 `@/types`？
- 痛点：`@types/*` 是 TS 官方声明包前缀，直接使用 `@types` 作为路径别名会触发解析冲突。
- 手段：将类型别名改为 `@/types`，并在 TS/Vite/Storybook 配置同步。
- 效果：避免与 DefinitelyTyped 命名空间冲突，导入路径统一。

## 12) 数据与算法类型安全（示例）
- 痛点：加权随机抽题需要确保键值类型正确，避免 string key 污染。
- 手段：`paperGenerator.ts` 使用 `RatioMap`、`QuestionType` 的显式映射，复制题库池避免源数据被修改，并使用 `unknown` 中转进行安全断言。
- 效果：减少运行期类型问题，算法更易维护与扩展。

## 13) 脚本清单（目的导向）
- 质量：`pnpm lint`、`pnpm lint:fix`、`pnpm format`、`pnpm format:write`、`pnpm typecheck`
- 构建与预览：`pnpm build`（含 `tsc -b`）、`pnpm preview`
- 分析：`pnpm analyze`（生成 `dist/stats.html`）
- 文档/组件：`pnpm storybook`、`pnpm storybook:build`

## 14) 当前状态
- `pnpm lint`、`pnpm typecheck` 已通过。
- 主要工程文件：`vite.config.mts`、`tsconfig.app.json`、`tsconfig.node.json`、`eslint.config.mjs`、`lint-staged.config.mjs`、`.husky/pre-commit`、`.env.example`、`.storybook/*`、`src/vite-env.d.ts`。

