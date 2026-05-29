# Prompt Optimizer 精简重构设计方案

## 背景

当前项目是一个功能完整的 pnpm monorepo，包含 6 个包（core/ui/web/extension/desktop/mcp-server），使用 Vue 3 + Naive UI + Tailwind + CodeMirror 等技术栈。Web 版加载缓慢（首屏 ~3-5s，JS Bundle ~300KB+ gzipped）。

目标：重构为一个**加载快、界面干净、操作简单**的提示词优化工具，满足日常 80% 的使用场景。

## 核心原则

- **极简** — 只保留日常最常用的功能
- **快速** — 首屏加载 < 2s，JS Bundle < 50KB gzipped
- **直接** — 打开即用，三步完成优化
- **零外部 UI 依赖** — 不引入任何重量级 UI 组件库

## 功能范围

### 保留
- 提示词优化（单模式，一个优化按钮 + 优化目标选择）
- 内置精选模板（5-8 个，下拉选择，无管理界面）
- 主流 LLM 提供商（OpenAI、Gemini、DeepSeek、Grok、Zhipu、SiliconFlow、自定义 OpenAI 兼容）
- 模型快速切换（下拉选择器）
- 暗色模式切换
- 自动保存草稿（localStorage，刷新不丢内容）
- 一键复制结果
- API Key 配置（简单弹窗配置）

### 去掉
- 系统提示词 / 用户提示词区分 → 合并为一个优化入口
- 优化前后对比面板 → 只展示结果
- 模板管理 CRUD → 内置模板下拉选择
- 图像生成（T2I/I2I/Multi-image）→ 全部去掉
- 多轮对话测试 → 去掉
- 变量提取 / 变量值生成 → 去掉
- 收藏管理 / 收藏夹 → 去掉
- 结构化评估 / 评估改写 → 去掉
- 历史记录（IndexedDB）→ 去掉，用 localStorage 自动保存当前草稿
- Chrome 扩展 → 不再维护
- 桌面应用（Electron）→ 不再维护
- MCP 服务器 → 不再维护
- Docker 部署 → Vercel 一键部署即可
- 多语言（i18n）→ 纯中文界面
- Vue Router → 单页应用，不需要路由
- CodeMirror → 普通 textarea

## 项目结构

```
prompt-optimizer/
├── src/
│   ├── components/
│   │   ├── AppTextarea.vue      # 自动缩放文本域
│   │   ├── AppSelect.vue        # 下拉选择器
│   │   ├── AppButton.vue        # 按钮（含加载状态）
│   │   ├── AppTabs.vue          # Tab 切换
│   │   ├── AppModal.vue         # 模态弹窗（设置用）
│   │   ├── AppToast.vue         # 轻提示
│   │   └── AppIcon.vue          # SVG 图标组件
│   ├── composables/
│   │   ├── useOptimize.ts       # 优化逻辑（调用 LLM）
│   │   ├── useModel.ts          # 模型/提供商管理
│   │   └── useAutoSave.ts       # 草稿自动保存
│   ├── adapters/                # LLM 适配器
│   │   ├── types.ts             # 统一接口类型
│   │   ├── registry.ts          # 适配器注册表
│   │   ├── openai.ts            # OpenAI + 兼容 API
│   │   ├── gemini.ts            # Google Gemini
│   │   └── anthropic.ts         # Anthropic Claude
│   ├── templates/
│   │   └── index.ts             # 内置模板数据
│   ├── utils/
│   │   ├── storage.ts           # localStorage 封装
│   │   └── env.ts               # 环境变量工具
│   ├── types/
│   │   └── index.ts             # 公共类型
│   ├── App.vue                  # 根组件（整个页面）
│   ├── main.ts                  # 入口
│   └── style.css                # 全局样式 + Tailwind
├── public/
│   └── favicon.svg
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.ts
├── postcss.config.js
└── vercel.json
```

## UI 布局

```
┌───────────────────────────────────────────────────┐
│  🔧 Prompt Optimizer     [GPT-4o ▼]  [⚙]  [🌙]  │
├───────────────────────────────────────────────────┤
│  [通用优化 | 更专业 | 更简洁 | 加结构 | 加示例]   │
│   ↑ 优化目标 Tab，点击即切换风格                    │
├──────────────────────┬────────────────────────────┤
│                      │                            │
│  输入提示词           │  优化结果                   │
│  ┌────────────────┐  │  ┌──────────────────────┐  │
│  │                │  │  │  正在优化... / 结果    │  │
│  │  textarea      │  │  │                      │  │
│  │  自动缩放到     │  │  │  [复制结果]           │  │
│  │  合适高度      │  │  │                      │  │
│  └────────────────┘  │  └──────────────────────┘  │
│                      │                            │
│  [模板: 角色扮演▼]   │                            │
│                      │                            │
├──────────────────────┴────────────────────────────┤
│  [▶ 优化]  ← 主按钮，点击调用 LLM 优化             │
└───────────────────────────────────────────────────┘
```

### 关键交互细节

1. **优化目标 Tab**: 点击切换，每次只能选一个，改变优化 prompt 的行为
2. **模板下拉**: 选择一个模板 → 自动填入左侧 textarea
3. **优化按钮**: 点击后变 loading 状态，右侧流式输出，完成后显示复制按钮
4. **自动保存**: textarea 内容变化 500ms 后自动存 localStorage，刷新后恢复
5. **设置弹窗**: 齿轮图标点击弹出，配置各模型的 API Key
6. **暗色模式**: 月亮图标切换，偏好存 localStorage

## 数据流

```
用户输入/选模板 → textarea (自动保存到 localStorage)
    ↓ 点击优化
优化目标 + 模型选择 + 提示词 → useOptimize()
    ↓
adapters/registry → 查找对应适配器
    ↓
LLM API (流式) → 逐块更新右侧面板
    ↓
完成 → 显示复制按钮
```

### 状态管理

不使用 Pinia/Vuex。使用 composable + reactive ref 管理局部状态，localStorage 做持久化：
- `useModel()` → 模型配置、API Key（localStorage 持久化）
- `useOptimize()` → 当前优化状态、结果（响应式，不持久化）
- `useAutoSave()` → 草稿内容（localStorage 持久化）

## LLM 适配器

设计保持现有 adapter 模式不变，但精简实现：

```typescript
interface LLMAdapter {
  provider: string
  models: string[]
  stream(params: StreamParams): AsyncGenerator<string>
}
```

每个适配器只实现流式调用，不做复杂封装。适配器注册表按需动态 import：

```typescript
const registry = new Map<string, () => Promise<LLMAdapter>>()
registry.set('openai', () => import('./openai'))
registry.set('gemini', () => import('./gemini'))
```

这样 unused 的 SDK 不会打包进首屏。

## 内置模板（5-8 个）

```typescript
// templates/index.ts
export const templates = [
  {
    id: 'role-play',
    name: '角色扮演',
    prompt: '你是一个...',
    description: '让 AI 扮演特定角色'
  },
  {
    id: 'professional',
    name: '专业写作',
    prompt: '请以专业、正式的语调...',
    description: '适用于商务/正式场景'
  },
  {
    id: 'concise',
    name: '简洁指令',
    prompt: '用最简洁的语言...',
    description: '步骤少、输出精炼'
  },
  // ... 更多
]
```

## 性能目标

| 指标 | 当前 | 目标 |
|------|------|------|
| JS Bundle (gzipped) | ~300KB+ | < 50KB |
| 首屏加载 | ~3-5s | < 1.5s |
| 依赖数量 | 30+ | ~10 |
| HTML/CSS/JS 请求 | ~20+ | ~5 |

## 部署

Vercel SPA 部署，`vercel.json` 配置：
```json
{
  "buildCommand": "pnpm build",
  "outputDirectory": "dist",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

不需要 Docker、Cloudflare Workers 等其他部署方式。

## 依赖清单

### dependencies
- `vue` ^3.5 — 框架
- `openai` — OpenAI + 兼容 API
- `@google/genai` — Gemini
- `@anthropic-ai/sdk` — Claude
- `mustache` — 模板渲染
- `zod` — 配置校验

### devDependencies
- `vite` ^6 — 构建工具
- `@vitejs/plugin-vue` — Vue 插件
- `tailwindcss` ^4 — CSS
- `@tailwindcss/typography` — 排版
- `typescript` — 类型检查
- `vue-tsc` — Vue 类型检查

（相比当前减少约 70% 的依赖）
