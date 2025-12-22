# 随机题库生成器 - 项目总结

## 📋 项目概述

**随机题库生成器**（Random Question Bank Generator）是一个纯前端的随机题库生成软件，用于从本地题库中按岗位和题型随机抽取题目，生成试卷并导出为 Word 文档。

### 核心功能

- 📚 **题库管理**：支持多岗位题库管理，每个岗位可独立维护题库
- 🎲 **智能抽题**：基于权重算法的随机抽题，支持自定义题型比例
- 📝 **试卷生成**：自动生成试卷，按题型和难度排序
- 📄 **Word 导出**：一键导出试卷和答案两份 Word 文档
- 💾 **本地存储**：使用 IndexedDB 实现数据持久化，无需后端服务器

### 技术特点

- ✅ 纯前端实现，无需后端支持
- ✅ 数据本地存储，保护隐私
- ✅ 响应式设计，适配多种设备
- ✅ TypeScript 严格类型检查
- ✅ 组件化架构，易于维护和扩展

---

## 🛠️ 技术栈

### 核心框架
- **React 19.2.0** - UI 框架
- **TypeScript 5.9.3** - 类型安全
- **Vite 7.2.4** - 构建工具

### 主要依赖
- **docx 9.5.1** - Word 文档生成
- **IndexedDB** - 浏览器本地数据库

### 开发工具
- **ESLint** - 代码质量检查
- **TypeScript ESLint** - TypeScript 代码规范

---

## 📁 项目结构

```
random-question-bank/
├── src/
│   ├── components/              # React 组件
│   │   ├── PaperPreview.tsx     # 试卷预览组件
│   │   ├── RatioSettings.tsx    # 权重设置组件
│   │   ├── RoleSelector.tsx     # 岗位选择组件
│   │   └── QuestionBankImporter.tsx # 题库导入组件
│   ├── hooks/                   # 自定义 Hooks
│   │   ├── useQuestionBanks.ts  # 题库数据管理 Hook
│   │   └── useRoleDisplayNames.ts # 角色显示名称 Hook
│   ├── i18n/                    # 国际化
│   │   └── strings.ts           # 中文字符串资源
│   ├── pages/                   # 页面组件
│   │   └── ImportPage.tsx       # 导入页面
│   ├── types/                   # 类型定义
│   │   └── questionBanks.ts
│   ├── utils/                   # 工具函数
│   │   ├── docExporter.ts       # Word 文档导出
│   │   ├── indexedDB.ts         # IndexedDB 数据管理
│   │   ├── paperGenerator.ts    # 试卷生成算法
│   │   └── typeMapper.ts        # 类型映射工具
│   ├── App.tsx                  # 主应用组件
│   ├── App.css                  # 应用样式
│   ├── index.css                # 全局样式
│   └── main.tsx                 # 应用入口
├── public/                      # 静态资源
├── dist/                        # 构建输出
├── package.json                 # 项目配置
├── tsconfig.json                # TypeScript 配置
├── tsconfig.app.json            # 应用编译配置
├── tsconfig.node.json           # 工具/脚本编译配置
├── vite.config.mts              # Vite 配置（ESM）
└── eslint.config.mjs            # ESLint 配置（ESM）
```

### 路径别名（`tsconfig.app.json`）
- `@components/*` → `src/components/*`
- `@hooks/*` → `src/hooks/*`
- `@pages/*` → `src/pages/*`
- `@services/*` → `src/services/*`
- `@types/*` → `src/types/*`
- `@utils/*` → `src/utils/*`
- `@i18n/*` → `src/i18n/*`

### 构建与性能
- 严格 ESM：`package.json` `type: module`，配置文件使用 `.mjs/.mts`
- 代码分割：`ImportPage` 采用 `React.lazy` + `Suspense` 懒加载
- 分包策略：Vite `manualChunks` 抽离 `react`、`docx`
- 体积分析：`pnpm run analyze` 生成 `dist/stats.html`（rollup-visualizer）
- 环境变量示例：`.env.example` 使用 `VITE_` 前缀

---

## 🎯 核心功能详解

### 1. 题库管理

#### 多岗位支持
- 每个岗位（Role）拥有独立的题库
- 支持创建新岗位，设置岗位 ID 和显示名称
- 岗位信息存储在 IndexedDB 的 `roles` 表中

#### 题目类型
支持 5 种题型：
- **单选题** (SingleChoice)
- **多选题** (MultipleChoice)
- **判断题** (TrueFalse)
- **填空题** (FillBlank)
- **简答题** (ShortAnswer)

#### 题目数据结构
```typescript
type Question = {
  id: string              // 唯一标识
  type: QuestionType      // 题型
  title: string          // 题目内容
  options?: string[]      // 选项（选择题）
  answer: string         // 答案
  score: number          // 分值
  difficulty: number     // 难度等级
}
```

### 2. 题库导入

#### 导入方式
- **手动输入**：支持 JSON 格式的题目数据
- **文件上传**：上传 JSON 文件导入
- **测试数据**：内置测试题目快速体验

#### 数据格式
```json
[
  {
    "type": "单选题",
    "title": "题目内容",
    "options": ["选项A", "选项B", "选项C", "选项D"],
    "answer": "选项A",
    "score": 5,
    "difficulty": 3
  }
]
```

### 3. 智能抽题算法

#### 权重系统
- 用户为每种题型设置权重（比例）
- 权重决定该题型被抽中的概率
- 权重不需要总和为 100，系统自动按比例计算

#### 抽题流程
1. 根据权重构建加权随机选择器
2. 循环抽题直到达到目标分数
3. 每次抽题后从题库中移除已选题目（避免重复）
4. 如果题库用尽，记录差额分数

#### 排序规则
- 按题型优先级排序（单选题 → 多选题 → 判断题 → 填空题 → 简答题）
- 同题型内按难度排序

### 4. Word 文档导出

#### 导出内容
- **试卷文档**：包含题目和选项，正确答案用红色标记
- **答案文档**：包含题目、选项和答案

#### 文档特性
- 自动生成标题和格式
- 选择题选项自动编号（A、B、C、D）
- 简答题和判断题自动添加空白行
- 文件名包含岗位名称和时间戳

---

## 💾 数据存储架构

### IndexedDB 设计

#### 数据库结构
- **数据库名**：`QuestionBankDB`
- **版本**：动态版本管理（支持升级）

#### Object Stores

1. **roles** - 角色信息表
   - Key: `id` (岗位 ID)
   - 字段：`id`, `displayName`, `createdAt`, `updatedAt`

2. **role_{roleId}** - 岗位题库表（动态创建）
   - Key: `'data'`
   - 存储格式：使用英文 key（single, multiple, judge, fill, short）

#### 数据迁移
- 支持从旧版本数据结构迁移
- 自动创建新岗位的 objectStore
- 版本升级时自动处理数据迁移

---

## 🎨 用户界面

### 页面结构

#### 首页（Home）
1. **步骤 1：选择岗位**
   - 岗位下拉选择器
   - 显示当前选择的岗位

2. **步骤 2：设置参数**
   - 目标总分设置
   - 各题型权重设置
   - 权重说明和示例
   - 随机生成按钮

3. **步骤 3：预览与导出**
   - 试卷预览
   - 题目统计信息
   - 导出 Word 按钮

#### 导入页面（Import）
1. **岗位管理**
   - 选择已有岗位
   - 创建新岗位

2. **题库导入**
   - 手动输入 JSON
   - 文件上传
   - 测试数据导入

---

## 🔧 核心工具函数

### `paperGenerator.ts`
- `generatePaper()` - 核心抽题算法
- `buildWeightedPicker()` - 构建加权随机选择器
- `randomPick()` - 随机选择函数

### `indexedDB.ts`
- `initDB()` - 初始化数据库
- `getAllRoles()` - 获取所有角色
- `saveRoleInfo()` - 保存角色信息
- `getQuestionBankByRole()` - 获取岗位题库
- `saveQuestionBankByRole()` - 保存岗位题库

### `docExporter.ts`
- `buildDoc()` - 构建 Word 文档
- `downloadDoc()` - 下载文档

### `typeMapper.ts`
- `typeToKey()` - 题型转存储 key
- `keyToType()` - 存储 key 转题型
- `isKnownType()` - 验证题型

---

## 🎯 设计模式与最佳实践

### 1. 组件化设计
- 功能组件独立，职责单一
- Props 类型严格定义
- 组件可复用性强

### 2. 状态管理
- 使用 React Hooks 管理状态
- 自定义 Hooks 封装业务逻辑
- 状态提升到合适的层级

### 3. 类型安全
- 全面的 TypeScript 类型定义
- 严格的类型检查配置
- 类型导出和复用

### 4. 代码组织
- 按功能模块组织文件
- 工具函数独立封装
- 国际化字符串集中管理

### 5. 错误处理
- 完善的错误提示
- 加载状态管理
- 用户友好的错误信息

---

## 📝 使用流程

### 首次使用

1. **创建岗位**
   - 进入导入页面
   - 输入岗位 ID 和显示名称
   - 点击创建

2. **导入题库**
   - 选择或创建岗位
   - 选择导入方式（手动/文件/测试数据）
   - 输入或上传题目数据
   - 点击导入

3. **生成试卷**
   - 返回首页
   - 选择岗位
   - 设置目标分数
   - 设置各题型权重
   - 点击"随机生成"

4. **导出文档**
   - 预览生成的试卷
   - 点击"导出 Word"
   - 自动下载试卷和答案两份文档

---

## 🚀 开发指南

### 环境要求
- Node.js >= 18
- pnpm（推荐）或 npm

### 安装依赖
```bash
pnpm install
```

### 开发模式
```bash
pnpm dev
```

### 构建生产版本
```bash
pnpm build
```

### 预览构建结果
```bash
pnpm preview
```

### 代码检查
```bash
pnpm lint
```

---

## 📊 项目统计

### 代码规模
- **组件数量**：4 个主要组件
- **页面数量**：2 个页面（首页、导入页）
- **工具函数**：4 个核心工具模块
- **自定义 Hooks**：2 个
- **类型定义**：完整的 TypeScript 类型系统

### 文件统计
- TypeScript/TSX 文件：约 15 个
- CSS 文件：2 个
- 配置文件：5 个

---

## 🔮 未来扩展方向

### 功能扩展
- [ ] 题目编辑和删除功能
- [ ] 题库导出功能
- [ ] 试卷模板自定义
- [ ] 题目难度自动分析
- [ ] 历史试卷记录
- [ ] 批量生成试卷

### 技术优化
- [ ] 添加单元测试
- [ ] 性能优化（大数据量处理）
- [ ] PWA 支持（离线使用）
- [ ] 多语言支持（i18n）
- [ ] 主题切换功能

### 用户体验
- [ ] 拖拽排序题目
- [ ] 题目搜索和筛选
- [ ] 更丰富的导出格式（PDF、Excel）
- [ ] 试卷打印优化

---

## 📄 许可证

本项目为私有项目。

---

## 👥 贡献

本项目为个人项目，欢迎提出建议和反馈。

---

## 📞 联系方式

如有问题或建议，请通过项目仓库提交 Issue。

---

**最后更新**：2024年12月

