# 前端项目手搭骨架：架构师的思考顺序

前提：已有最基础的 React 项目（仅 JSX/JS，无打包与工程化）。以下是把它演进为可长期维护骨架的决策链路，聚焦“为什么需要 → 用什么 → 配什么 → 得到什么”。

## 1) 先跑起来：选打包工具
- 问题：需要本地开发、产物构建与代码分割；Webpack VS Vite，期望更快的 HMR 和更小的配置成本。
- 选择：Vite。
- 配置要点（`vite.config.mts`）：
  - ESM/路径别名：与 TS 同步 `@components/@hooks/@pages/@services/@/types/@utils/@i18n`，避免 `@types` 命名冲突。
  - 分包与性能：`manualChunks` 抽离 `react`、`docx`，`build.target: "es2022"`，`chunkSizeWarningLimit: 600`。
  - 体积分析：`ANALYZE=true pnpm analyze` → `rollup-plugin-visualizer` 生成 `dist/stats.html`。
  - 懒加载示例：`ImportPage` 用 `React.lazy` + `Suspense`，展示路由级分割。
- 效果：开发快、首屏包可控、依赖体积可视化。

## 2) 补全类型：JS → TS（含配置）
- 问题：JS 无类型提示，易埋坑；同时需要让工具链理解 TS/ESM。
- 选择：TypeScript。
- 配置拆分：
  - `tsconfig.app.json`（浏览器侧）：`strict`、`moduleResolution: "bundler"`、`verbatimModuleSyntax`、`allowImportingTsExtensions`、`moduleDetection: "force"`、`jsx: "react-jsx"`；别名同 Vite。
  - `tsconfig.node.json`（工具/配置侧）：同样走 bundler/ESM 解析，覆盖 `vite.config.mts`、`eslint.config.mjs`、`lint-staged.config.mjs`、`.storybook/**/*.mts`。
- 模块模式：`package.json` 设置 `type: "module"`，所有 Node 侧配置改用 `.mts/.mjs`。
- 效果：类型提示完整，CJS/ESM 冲突消除，工具与业务各用适配的 TS 语境。

## 3) 统一风格与质量：ESLint + Prettier + 提交流水线
- 问题：导入顺序/格式/Hook 规则不统一，低质量改动易混入。
- 选择与配置：
  - ESLint（`eslint.config.mjs`，flat）：`typescript-eslint`（类型感知）、`simple-import-sort`（导入排序）、`react-hooks`（Hook 规则）、`react-refresh`（HMR 友好）、`prettier` 关闭冲突格式规则。
  - Prettier（`.prettierrc`）：行宽/引号/分号/尾逗号；`.prettierignore` 排除产物与锁文件。
  - Husky + lint-staged：`.husky/pre-commit` 里对暂存区跑 `eslint --fix`、`prettier --write`、`tsc -b --noEmit`，配置在 `lint-staged.config.mjs`。
- 效果：提交前自动修复与校验，导入有序，Hook 规范可靠。

## 4) 环境与声明：让配置可复制、类型无缺口
- 问题：环境变量命名混乱，静态资源缺声明。
- 手段：
  - `.env.example` + Vite `envPrefix: "VITE_"`：强制前端变量前缀。
  - `src/vite-env.d.ts`：声明 `vite/client`，补充 `*.css` 模块。
- 效果：环境配置可复用不泄漏，IDE/编译无类型缺口。

## 5) 组件开发体验：Storybook
- 问题：组件级迭代/回归不应绑死在主路由。
- 手段：`.storybook/main.mts`（ESM、别名同步、禁 telemetry）、`.storybook/preview.mts`（全局样式、actions/controls）、示例 `RatioSettings.stories.tsx`。TS 配置继承 Node 侧并开启 JSX。
- 效果：组件可独立预览、交互、视觉回归，且与应用 typecheck 解耦。

## 6) 类型安全示例：算法与数据
- 痛点：加权抽题需严格键值类型，避免 string 污染。
- 手段：`paperGenerator.ts` 使用 `RatioMap`/`QuestionType`，复制题库池防止源数据被改，用 `unknown` 中转做安全断言。
- 效果：减少运行期类型问题，算法可维护。

## 7) 脚本速览（按目标分组）
- 质量：`pnpm lint` / `lint:fix` / `format` / `format:write` / `typecheck`
- 构建与预览：`pnpm build`（含 `tsc -b`）、`pnpm preview`
- 分析：`pnpm analyze`（产出 `dist/stats.html`）
- 组件/文档：`pnpm storybook` / `storybook:build`

## 8) 如果把它抽象为一套骨架
- 开箱项：ESM + TS 分层 tsconfig、Vite 别名/分包/分析、ESLint+Prettier+Husky+lint-staged、环境模板、vite-env 声明、Storybook 基线。
- 可选扩展：CI（lint+typecheck+storybook:build）、Tailwind/Design Token、测试（Vitest/RTL）、PWA。
