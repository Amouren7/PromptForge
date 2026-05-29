# Prompt Optimizer 精简重构实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将原有的 pnpm monorepo（core/ui/web/extension/desktop/mcp-server）重构为一个单 Vite + Vue 3 项目，加载更快、界面更干净。

**Architecture:** 单项目 Vite + Vue 3，所有代码在 `src/` 下按功能分层（adapters/composables/components/templates）。不使用 Pinia/Vuex，使用 composable + reactive ref + localStorage。LLM 适配器使用按需 dynamic import 实现 code splitting。

**Tech Stack:** Vue 3.5 + TypeScript 5.9 + Tailwind CSS 4 + Vite 8 + OpenAI SDK + Google Gen AI SDK + Anthropic SDK

---

### Task 1: 清理旧 monorepo 结构

**Files:**
- Delete: `packages/` 目录（所有旧包）
- Delete: `pnpm-workspace.yaml`
- Delete: `middleware.js`
- Delete: `wrangler.jsonc`
- Delete: `.npmrc`
- Delete: `Dockerfile`, `.dockerignore`, `docker/`
- Delete: `playwright.config.ts`
- Delete: `env.local.example`
- Delete: `.github/`（移除 workflows）
- Delete: `mkdocs/`, `site/`, `releases/`, `images/`, `api/`
- Keep: `docs/`, `scripts/`, `CHANGELOG.md`, `LICENSE`, `README.md`, `README.zh-CN.md`, `.gitignore`, `.gitattributes`, `.claude/`
- Modify: `package.json`（重置为单项目）

- [ ] **Step 1: 创建新的目录结构**

  在项目根目录创建以下空目录：
  ```bash
  mkdir -p src/components src/composables src/adapters src/templates src/utils src/types public
  ```

- [ ] **Step 2: 删除旧的文件**

  ```bash
  rm -rf packages pnpm-workspace.yaml middleware.js wrangler.jsonc .npmrc Dockerfile .dockerignore docker/ playwright.config.ts env.local.example .github mkdocs/ site/ releases/ images/ api/
  ```

- [ ] **Step 3: 重置 package.json**

```json
{
  "name": "prompt-optimizer",
  "version": "3.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vue-tsc --noEmit && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "vue": "^3.5.31",
    "openai": "^6.33.0",
    "@google/genai": "^1.46.0",
    "@anthropic-ai/sdk": "^0.80.0"
  },
  "devDependencies": {
    "typescript": "^5.9.3",
    "vite": "^8.0.3",
    "@vitejs/plugin-vue": "^6.0.5",
    "vue-tsc": "^3.2.6",
    "tailwindcss": "^4.2.2",
    "@tailwindcss/vite": "^4.2.2",
    "@tailwindcss/typography": "^0.5.19"
  }
}
```

- [ ] **Step 4: 创建 vite.config.ts**

```typescript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [vue(), tailwindcss()],
})
```

- [ ] **Step 5: 创建 tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "jsx": "preserve",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "esModuleInterop": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "noEmit": true,
    "paths": {
      "@/*": ["./src/*"]
    },
    "baseUrl": "."
  },
  "include": ["src/**/*.ts", "src/**/*.vue", "env.d.ts"]
}
```

- [ ] **Step 6: 创建 tsconfig.node.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noEmit": true
  },
  "include": ["vite.config.ts"]
}
```

- [ ] **Step 7: 创建 env.d.ts**

```typescript
/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}
```

- [ ] **Step 8: 创建 index.html**

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Prompt Optimizer - 提示词优化器</title>
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

- [ ] **Step 9: 安装依赖**

```bash
pnpm install
```

- [ ] **Step 10: 验证构建**

```bash
pnpm build
```
Expected: 构建成功，无错误。

- [ ] **Step 11: Commit**

```bash
git add -A && git commit -m "chore: reset project to single Vite + Vue app scaffold"
```

---

### Task 2: 类型定义和工具函数

**Files:**
- Create: `src/types/index.ts`
- Create: `src/utils/storage.ts`

- [ ] **Step 1: 创建 src/types/index.ts**

```typescript
/** LLM 提供商定义 */
export interface ProviderDef {
  id: string
  name: string
  /** 使用的适配器类型: 'openai' | 'gemini' | 'anthropic' */
  adapter: string
  /** OpenAI 兼容 API 的基础 URL */
  baseUrl?: string
  /** 可选的模型列表 */
  models: string[]
}

/** 已保存的提供商配置（localStorage） */
export interface ProviderConfig {
  apiKey: string
  baseUrl?: string
  /** 自定义提供商需要指定模型名 */
  modelName?: string
}

/** 当前选中的模型 */
export interface ModelSelection {
  providerId: string
  modelId: string
}

/** 优化目标 */
export type OptimizeGoal =
  | 'general'
  | 'professional'
  | 'concise'
  | 'structured'
  | 'examples'

export const OPTIMIZE_GOALS: { id: OptimizeGoal; label: string; prompt: string }[] = [
  { id: 'general', label: '通用优化', prompt: '对以下提示词进行全面优化，使其更清晰、更有效，保留原始意图。' },
  { id: 'professional', label: '更专业', prompt: '使以下提示词更加专业、正式，适合商务和专业场景。' },
  { id: 'concise', label: '更简洁', prompt: '精简以下提示词，保留核心指令，去除冗余表达。' },
  { id: 'structured', label: '加结构', prompt: '为以下提示词增加结构化元素：角色定义、分段指令、输出格式约束。' },
  { id: 'examples', label: '加示例', prompt: '在以下提示词中补充输入/输出示例，用 Few-shot 方式增强可理解性。' },
]

/** 内置提示词模板 */
export interface PromptTemplate {
  id: string
  name: string
  prompt: string
  description: string
}

/** LLM 适配器统一接口 */
export interface LLMAdapter {
  /** 流式调用 LLM，逐块产出文本 */
  stream(params: {
    model: string
    apiKey: string
    systemPrompt: string
    userMessage: string
    baseUrl?: string
    signal?: AbortSignal
  }): AsyncGenerator<string>

  /** 非流式调用 */
  complete(params: {
    model: string
    apiKey: string
    systemPrompt: string
    userMessage: string
    baseUrl?: string
    signal?: AbortSignal
  }): Promise<string>
}
```

- [ ] **Step 2: 创建 src/utils/storage.ts**

```typescript
const PREFIX = 'po_'

export const storage = {
  get<T>(key: string): T | null {
    try {
      const raw = localStorage.getItem(PREFIX + key)
      return raw ? (JSON.parse(raw) as T) : null
    } catch {
      return null
    }
  },

  set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value))
    } catch {
      // localStorage 写满时静默失败
    }
  },

  remove(key: string): void {
    localStorage.removeItem(PREFIX + key)
  },
}
```

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: add types and storage utility"
```

---

### Task 3: LLM 适配器 — 类型定义和注册表

**Files:**
- Create: `src/adapters/types.ts`
- Create: `src/adapters/registry.ts`

- [ ] **Step 1: 创建 src/adapters/types.ts**

```typescript
import type { LLMAdapter } from '../types'

export interface AdapterModule {
  default: LLMAdapter
}

/** 适配器注册表：按 providerId 动态加载适配器 */
export type AdapterLoader = () => Promise<AdapterModule>

/** 所有支持的提供商定义 */
export const PROVIDERS = [
  { id: 'openai', name: 'OpenAI', adapter: 'openai', models: ['gpt-4o', 'gpt-4o-mini', 'o3-mini'] },
  { id: 'deepseek', name: 'DeepSeek', adapter: 'openai', baseUrl: 'https://api.deepseek.com/v1', models: ['deepseek-chat', 'deepseek-reasoner'] },
  { id: 'grok', name: 'Grok (xAI)', adapter: 'openai', baseUrl: 'https://api.x.ai/v1', models: ['grok-2', 'grok-3-beta'] },
  { id: 'zhipu', name: '智谱', adapter: 'openai', baseUrl: 'https://open.bigmodel.cn/api/paas/v4', models: ['glm-4-plus', 'glm-4-air'] },
  { id: 'siliconflow', name: 'SiliconFlow', adapter: 'openai', baseUrl: 'https://api.siliconflow.cn/v1', models: ['deepseek-ai/DeepSeek-V3', 'deepseek-ai/DeepSeek-R1', 'Qwen/Qwen2.5-72B-Instruct'] },
  { id: 'custom', name: '自定义(兼容)', adapter: 'openai', baseUrl: '', models: [] },
  { id: 'gemini', name: 'Gemini', adapter: 'gemini', models: ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'] },
  { id: 'anthropic', name: 'Anthropic', adapter: 'anthropic', models: ['claude-sonnet-4-20250514', 'claude-haiku-3-5-sonnet-20241022'] },
] as const
```

- [ ] **Step 2: 创建 src/adapters/registry.ts**

```typescript
import type { LLMAdapter } from '../types'
import type { AdapterLoader } from './types'

const loaders: Record<string, AdapterLoader> = {
  openai: () => import('./openai'),
  gemini: () => import('./gemini'),
  anthropic: () => import('./anthropic'),
}

const cache = new Map<string, LLMAdapter>()

/** 获取指定 provider 的适配器实例（动态 import，缓存结果） */
export async function getAdapter(adapterType: string): Promise<LLMAdapter> {
  if (cache.has(adapterType)) return cache.get(adapterType)!

  const loader = loaders[adapterType]
  if (!loader) throw new Error(`Unknown adapter type: ${adapterType}`)

  const module = await loader()
  cache.set(adapterType, module.default)
  return module.default
}
```

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: add LLM adapter types and registry with dynamic loading"
```

---

### Task 4: OpenAI 适配器

**Files:**
- Create: `src/adapters/openai.ts`

这个适配器覆盖所有 OpenAI 兼容 API：OpenAI、DeepSeek、Grok、智谱、SiliconFlow、自定义。

- [ ] **Step 1: 创建 src/adapters/openai.ts**

```typescript
import OpenAI from 'openai'
import type { LLMAdapter } from '../types'

const adapter: LLMAdapter = {
  async *stream({ model, apiKey, systemPrompt, userMessage, baseUrl, signal }) {
    const client = new OpenAI({
      apiKey,
      baseURL: baseUrl || undefined,
      dangerouslyAllowBrowser: true,
    })

    const stream = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      stream: true,
    }, { signal })

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content
      if (text) yield text
    }
  },

  async complete({ model, apiKey, systemPrompt, userMessage, baseUrl, signal }) {
    const client = new OpenAI({
      apiKey,
      baseURL: baseUrl || undefined,
      dangerouslyAllowBrowser: true,
    })

    const res = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
    }, { signal })

    return res.choices[0]?.message?.content ?? ''
  },
}

export default adapter
```

- [ ] **Step 2: Commit**

```bash
git add -A && git commit -m "feat: add OpenAI-compatible adapter"
```

---

### Task 5: Gemini 和 Anthropic 适配器

**Files:**
- Create: `src/adapters/gemini.ts`
- Create: `src/adapters/anthropic.ts`

- [ ] **Step 1: 创建 src/adapters/gemini.ts**

```typescript
import { GoogleGenAI } from '@google/genai'
import type { LLMAdapter } from '../types'

const adapter: LLMAdapter = {
  async *stream({ model, apiKey, systemPrompt, userMessage }) {
    const client = new GoogleGenAI({ apiKey })

    const response = await client.models.generateContentStream({
      model,
      contents: [{ role: 'user', parts: [{ text: userMessage }] }],
      config: { systemInstruction: systemPrompt },
    })

    for await (const chunk of response) {
      const text = chunk.text()
      if (text) yield text
    }
  },

  async complete({ model, apiKey, systemPrompt, userMessage }) {
    const client = new GoogleGenAI({ apiKey })

    const response = await client.models.generateContent({
      model,
      contents: [{ role: 'user', parts: [{ text: userMessage }] }],
      config: { systemInstruction: systemPrompt },
    })

    return response.text ?? ''
  },
}

export default adapter
```

- [ ] **Step 2: 创建 src/adapters/anthropic.ts**

```typescript
import Anthropic from '@anthropic-ai/sdk'
import type { LLMAdapter } from '../types'

const adapter: LLMAdapter = {
  async *stream({ model, apiKey, systemPrompt, userMessage }) {
    const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true })

    const stream = await client.messages.create({
      model,
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
      stream: true,
    })

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        yield event.delta.text
      }
    }
  },

  async complete({ model, apiKey, systemPrompt, userMessage }) {
    const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true })

    const res = await client.messages.create({
      model,
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    })

    return res.content
      .filter((b): b is { type: 'text'; text: string } => b.type === 'text')
      .map(b => b.text)
      .join('')
  },
}

export default adapter
```

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: add Gemini and Anthropic adapters"
```

---

### Task 6: 优化系统提示词

**Files:**
- Create: `src/optimization/prompts.ts`

- [ ] **Step 1: 创建 src/optimization/prompts.ts**

```typescript
import type { OptimizeGoal } from '../types'

const GOAL_DESCRIPTIONS: Record<OptimizeGoal, string> = {
  general: '对以下提示词进行全面优化，使其更清晰、更有效，保留原始意图。',
  professional: '使以下提示词更加专业、正式，适合商务和专业场景。',
  concise: '精简以下提示词，保留核心指令，去除冗余表达。',
  structured: '为以下提示词增加结构化元素：角色定义、分段指令、输出格式约束。',
  examples: '在以下提示词中补充输入/输出示例，用 Few-shot 方式增强可理解性。',
}

/**
 * 构建优化请求的系统提示词
 */
export function buildOptimizationSystemPrompt(goal: OptimizeGoal): string {
  return `你是一个专业的提示词优化专家。你的任务是根据用户的优化目标，优化用户提供的提示词。

优化目标：${GOAL_DESCRIPTIONS[goal]}

要求：
1. 保留用户原始提示词的核心意图
2. 直接输出优化后的提示词，不要添加解释、说明或前缀
3. 不要用引号包裹输出内容`
}

/**
 * 构建优化请求的用户消息
 */
export function buildOptimizationUserMessage(sourcePrompt: string): string {
  return `请优化以下提示词：\n\n${sourcePrompt}`
}
```

- [ ] **Step 2: 创建 src/optimization/index.ts**

```typescript
export { buildOptimizationSystemPrompt, buildOptimizationUserMessage } from './prompts'
```

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: add optimization prompt templates"
```

---

### Task 7: 内置提示词模板

**Files:**
- Create: `src/templates/index.ts`

- [ ] **Step 1: 创建 src/templates/index.ts**

```typescript
import type { PromptTemplate } from '../types'

export const TEMPLATES: PromptTemplate[] = [
  {
    id: 'role-play',
    name: '角色扮演',
    description: '让 AI 扮演特定角色或身份',
    prompt: `你是一位[角色名称]，拥有[相关背景/经验]。

请以该角色的身份，基于以下场景和规则与我对话：

## 角色背景
[角色背景描述]

## 对话规则
1. 始终保持角色设定
2. [其他规则]`,
  },
  {
    id: 'analysis',
    name: '深度分析',
    description: '要求 AI 进行结构化深度分析',
    prompt: `请你从以下维度对[主题]进行分析：

## 1. 核心概述
简要说明[主题]的本质和关键点

## 2. 优势与劣势
- 优势：
- 劣势：

## 3. 关键洞察
提供 3-5 个深度见解

## 4. 建议
基于分析给出可操作的建议`,
  },
  {
    id: 'writing',
    name: '专业写作',
    description: '正式、专业的写作任务',
    prompt: `请以专业、正式的语调撰写一篇关于[主题]的文章。

## 要求
- 语言正式、逻辑清晰
- 结构完整：引言、正文、结论
- 数据/事实准确
- 目标读者：[目标读者]
- 字数：约[字数]字`,
  },
  {
    id: 'brainstorm',
    name: '头脑风暴',
    description: '生成创意想法和方案',
    prompt: `围绕"[主题]"进行头脑风暴，请：

1. 从多个角度提出创意想法
2. 每个想法简要说明可行性
3. 指出每个方案的优缺点
4. 最后推荐 2-3 个最有潜力的方向并说明理由

请尽量跳出常规思维。`,
  },
  {
    id: 'summary',
    name: '总结提炼',
    description: '对长文本进行结构化摘要',
    prompt: `请对以下内容进行结构化总结：

## 核心观点（一句话概括）
## 关键要点（3-5 点）
## 重要细节
## 行动建议`,
  },
  {
    id: 'code-review',
    name: '代码审查',
    description: '审查代码质量、安全性和性能',
    prompt: `请审查以下代码：

## 1. 功能正确性
代码是否能正确实现其目标？

## 2. 潜在 Bug
是否存在边界情况、空指针、并发问题等？

## 3. 性能问题
是否存在不必要循环、重复计算、内存泄漏等？

## 4. 安全性
是否存在注入风险、权限问题等？

## 5. 改进建议
给出具体的代码优化建议`,
  },
]
```

- [ ] **Step 2: Commit**

```bash
git add -A && git commit -m "feat: add built-in prompt templates"
```

---

### Task 8: Composables — useModel

**Files:**
- Create: `src/composables/useModel.ts`

- [ ] **Step 1: 创建 src/composables/useModel.ts**

```typescript
import { reactive } from 'vue'
import { storage } from '../utils/storage'
import { PROVIDERS } from '../adapters/types'
import type { ProviderConfig, ModelSelection } from '../types'

const STORAGE_KEY = 'model_config'

interface ModelState {
  configs: Record<string, ProviderConfig>
  selection: ModelSelection
}

function defaultState(): ModelState {
  return {
    configs: {},
    selection: { providerId: 'openai', modelId: 'gpt-4o' },
  }
}

const state = reactive<ModelState>(storage.get<ModelState>(STORAGE_KEY) ?? defaultState())

function persist() {
  storage.set(STORAGE_KEY, { configs: state.configs, selection: state.selection })
}

export function useModel() {
  function getProviderConfig(providerId: string): ProviderConfig {
    return state.configs[providerId] ?? { apiKey: '' }
  }

  function setProviderConfig(providerId: string, config: ProviderConfig) {
    state.configs[providerId] = config
    persist()
  }

  function selectModel(providerId: string, modelId: string) {
    state.selection = { providerId, modelId }
    persist()
  }

  function getProvider(id: string) {
    return PROVIDERS.find(p => p.id === id)
  }

  const currentProvider = () => getProvider(state.selection.providerId)

  /** 当前有效的模型 ID（自定义提供商使用配置的模型名） */
  const currentModelId = () => {
    if (state.selection.providerId === 'custom') {
      return state.configs.custom?.modelName || ''
    }
    return state.selection.modelId
  }

  /** 当前提供商的可用模型列表 */
  const currentModelOptions = () => {
    if (state.selection.providerId === 'custom') {
      const name = state.configs.custom?.modelName
      return name ? [{ value: name, label: name }] : []
    }
    const p = getProvider(state.selection.providerId)
    return (p?.models ?? []).map(m => ({ value: m, label: m }))
  }

  return {
    configs: state.configs,
    selection: state.selection,
    getProviderConfig,
    setProviderConfig,
    selectModel,
    getProvider,
    currentProvider,
    currentModelId,
    currentModelOptions,
    providers: PROVIDERS,
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add -A && git commit -m "feat: add useModel composable for provider config"
```

---

### Task 9: Composables — useOptimize 和 useAutoSave

**Files:**
- Create: `src/composables/useOptimize.ts`
- Create: `src/composables/useAutoSave.ts`

- [ ] **Step 1: 创建 src/composables/useOptimize.ts**

```typescript
import { ref } from 'vue'
import { getAdapter } from '../adapters/registry'
import { buildOptimizationSystemPrompt, buildOptimizationUserMessage } from '../optimization'
import { useModel } from './useModel'
import type { OptimizeGoal } from '../types'

export function useOptimize() {
  const result = ref('')
  const loading = ref(false)
  const error = ref<string | null>(null)
  const abortController = ref<AbortController | null>(null)

  async function optimize(sourcePrompt: string, goal: OptimizeGoal) {
    // 重置状态
    result.value = ''
    error.value = null
    loading.value = true

    const { selection, currentModelId, getProviderConfig, currentProvider } = useModel()
    const provider = currentProvider()
    if (!provider) {
      error.value = '请先选择模型'
      loading.value = false
      return
    }

    const modelId = currentModelId()
    if (!modelId) {
      error.value = '请选择模型或配置自定义模型名称'
      loading.value = false
      return
    }

    const config = getProviderConfig(selection.providerId)
    if (!config.apiKey) {
      error.value = '请先配置 API Key'
      loading.value = false
      return
    }

    abortController.value = new AbortController()

    try {
      const adapter = await getAdapter(provider.adapter)
      const systemPrompt = buildOptimizationSystemPrompt(goal)
      const userMessage = buildOptimizationUserMessage(sourcePrompt)

      const stream = adapter.stream({
        model: modelId,
        apiKey: config.apiKey,
        baseUrl: config.baseUrl || provider.baseUrl,
        systemPrompt,
        userMessage,
        signal: abortController.value.signal,
      })

      for await (const chunk of stream) {
        result.value += chunk
      }
    } catch (e: any) {
      if (e.name === 'AbortError') {
        // 用户取消，不显示错误
      } else {
        error.value = e.message || '优化失败，请稍后重试'
      }
    } finally {
      loading.value = false
      abortController.value = null
    }
  }

  function cancel() {
    abortController.value?.abort()
  }

  function reset() {
    result.value = ''
    error.value = null
  }

  return { result, loading, error, optimize, cancel, reset }
}
```

- [ ] **Step 2: 创建 src/composables/useAutoSave.ts**

```typescript
import { watch, ref } from 'vue'
import { storage } from '../utils/storage'

const STORAGE_KEY = 'draft'

export function useAutoSave() {
  const draft = ref(storage.get<string>(STORAGE_KEY) ?? '')

  // 防抖自动保存：内容变化 500ms 后保存
  let timer: ReturnType<typeof setTimeout> | null = null
  watch(draft, (val) => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      storage.set(STORAGE_KEY, val)
    }, 500)
  })

  function clearDraft() {
    draft.value = ''
    storage.remove(STORAGE_KEY)
  }

  return { draft, clearDraft }
}
```

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: add useOptimize and useAutoSave composables"
```

---

### Task 10: UI 组件

**Files:**
- Create: `src/components/AppIcon.vue`
- Create: `src/components/AppButton.vue`
- Create: `src/components/AppSelect.vue`
- Create: `src/components/AppTextarea.vue`
- Create: `src/components/AppTabs.vue`
- Create: `src/components/AppModal.vue`
- Create: `src/components/AppToast.vue`

- [ ] **Step 1: 创建 src/components/AppIcon.vue**

```vue
<script setup lang="ts">
defineProps<{
  name: 'sun' | 'moon' | 'settings' | 'copy' | 'send' | 'close' | 'sparkles'
  size?: number
}>()
</script>

<template>
  <svg
    :width="size ?? 20"
    :height="size ?? 20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <!-- sun -->
    <template v-if="name === 'sun'">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </template>
    <!-- moon -->
    <template v-else-if="name === 'moon'">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </template>
    <!-- settings -->
    <template v-else-if="name === 'settings'">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </template>
    <!-- copy -->
    <template v-else-if="name === 'copy'">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </template>
    <!-- send -->
    <template v-else-if="name === 'send'">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </template>
    <!-- close -->
    <template v-else-if="name === 'close'">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </template>
    <!-- sparkles (AI icon) -->
    <template v-else-if="name === 'sparkles'">
      <path d="M12 3l1.5 5.3L18 9l-4.5 2.7L12 17l-1.5-5.3L6 9l4.5-2.7z" />
      <path d="M5 16l.7 2.3L8 19l-2.3 1.1L5 22.5l-1.2-2.4L1.5 19l2.3-1.1z" />
      <path d="M18 3l.4 1.5L20 5l-1.6.7L18 7.2l-.8-1.5L15.5 5l1.6-.7z" />
      <path d="M18 14l.7 1.8L20.5 16l-1.8 1.1L19 19l-1.7-1.3L15.5 18l.7-1.8L14.5 15l1.8-.7z" />
    </template>
  </svg>
</template>
```

- [ ] **Step 2: 创建 src/components/AppButton.vue**

```vue
<script setup lang="ts">
defineProps<{
  disabled?: boolean
  loading?: boolean
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md'
}>()
</script>

<template>
  <button
    :disabled="disabled || loading"
    :class="[
      'inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/40 disabled:opacity-50 disabled:cursor-not-allowed',
      variant === 'primary' || !variant ? 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800' : '',
      variant === 'secondary' ? 'border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700' : '',
      variant === 'ghost' ? 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800' : '',
      size === 'sm' ? 'px-2.5 py-1.5 text-xs' : 'px-4 py-2 text-sm',
    ]"
  >
    <svg v-if="loading" class="animate-spin -ml-1 h-4 w-4" viewBox="0 0 24 24" fill="none">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
    <slot />
  </button>
</template>
```

- [ ] **Step 3: 创建 src/components/AppSelect.vue**

```vue
<script setup lang="ts">
defineProps<{
  modelValue: string
  options: { value: string; label: string }[]
  label?: string
}>()
defineEmits<{ 'update:modelValue': [value: string] }>()
</script>

<template>
  <div class="flex items-center gap-2">
    <label v-if="label" class="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{{ label }}</label>
    <select
      :value="modelValue"
      @change="$emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
      class="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-colors"
    >
      <option v-for="opt in options" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
    </select>
  </div>
</template>
```

- [ ] **Step 4: 创建 src/components/AppTextarea.vue**

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'

const props = defineProps<{
  modelValue: string
  placeholder?: string
  readonly?: boolean
}>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
const textareaRef = ref<HTMLTextAreaElement>()

function autoResize() {
  const el = textareaRef.value
  if (el) {
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 500) + 'px'
  }
}

onMounted(autoResize)

function onInput(e: Event) {
  const val = (e.target as HTMLTextAreaElement).value
  emit('update:modelValue', val)
  autoResize()
}
</script>

<template>
  <textarea
    ref="textareaRef"
    :value="modelValue"
    :placeholder="placeholder"
    :readonly="readonly"
    @input="onInput"
    class="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-colors resize-none min-h-[120px] font-mono leading-relaxed"
  />
</template>
```

- [ ] **Step 5: 创建 src/components/AppTabs.vue**

```vue
<script setup lang="ts">
defineProps<{
  tabs: { id: string; label: string }[]
  modelValue: string
}>()
defineEmits<{ 'update:modelValue': [value: string] }>()
</script>

<template>
  <div class="flex gap-1 rounded-lg bg-gray-100 dark:bg-gray-800 p-1" role="tablist">
    <button
      v-for="tab in tabs"
      :key="tab.id"
      role="tab"
      :aria-selected="modelValue === tab.id"
      @click="$emit('update:modelValue', tab.id)"
      :class="[
        'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
        modelValue === tab.id
          ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200',
      ]"
    >
      {{ tab.label }}
    </button>
  </div>
</template>
```

- [ ] **Step 6: 创建 src/components/AppModal.vue**

```vue
<script setup lang="ts">
defineProps<{ show: boolean; title: string }>()
defineEmits<{ close: [] }>()
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center p-4" @click.self="$emit('close')">
        <div class="absolute inset-0 bg-black/40" />
        <div class="relative bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-lg max-h-[80vh] overflow-y-auto p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-base font-semibold text-gray-900 dark:text-gray-100">{{ title }}</h2>
            <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <slot />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active, .modal-leave-active { transition: opacity 0.2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
</style>
```

- [ ] **Step 7: 创建 src/components/AppToast.vue**

```vue
<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{ message: string; show: boolean }>()
const visible = ref(false)
let timer: ReturnType<typeof setTimeout>

watch(() => props.show, (val) => {
  if (val) {
    visible.value = true
    clearTimeout(timer)
    timer = setTimeout(() => { visible.value = false }, 2500)
  }
})
</script>

<template>
  <Teleport to="body">
    <Transition name="toast">
      <div v-if="visible" class="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-lg bg-gray-900 dark:bg-gray-700 text-white text-sm shadow-lg">
        {{ message }}
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.toast-enter-active, .toast-leave-active { transition: all 0.3s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translate(-50%, 10px); }
</style>
```

- [ ] **Step 8: Commit**

```bash
git add -A && git commit -m "feat: add UI components (Icon, Button, Select, Textarea, Tabs, Modal, Toast)"
```

---

### Task 11: 主页面 App.vue + main.ts + style.css

**Files:**
- Create: `src/style.css`
- Create: `src/main.ts`
- Create: `src/App.vue`

- [ ] **Step 1: 创建 src/style.css**

```css
@import "tailwindcss";

@custom-variant dark (&:where(.dark, .dark *));

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans SC", sans-serif;
  @apply bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 antialiased;
}

/* 滚动条样式 */
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { @apply bg-gray-300 dark:bg-gray-700 rounded-full; }
::-webkit-scrollbar-thumb:hover { @apply bg-gray-400 dark:bg-gray-600; }
```

- [ ] **Step 2: 创建 src/main.ts**

```typescript
import { createApp } from 'vue'
import App from './App.vue'
import './style.css'

createApp(App).mount('#app')
```

- [ ] **Step 3: 创建 src/App.vue**

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'
import { OPTIMIZE_GOALS } from './types'
import type { OptimizeGoal, PromptTemplate } from './types'
import { TEMPLATES } from './templates'
import { useModel } from './composables/useModel'
import { useOptimize } from './composables/useOptimize'
import { useAutoSave } from './composables/useAutoSave'
import AppIcon from './components/AppIcon.vue'
import AppButton from './components/AppButton.vue'
import AppSelect from './components/AppSelect.vue'
import AppTextarea from './components/AppTextarea.vue'
import AppTabs from './components/AppTabs.vue'
import AppModal from './components/AppModal.vue'
import AppToast from './components/AppToast.vue'

// --- 暗色模式 ---
const dark = ref(localStorage.getItem('po_dark') === 'true')
function toggleDark() {
  dark.value = !dark.value
  localStorage.setItem('po_dark', String(dark.value))
}
document.documentElement.classList.toggle('dark', dark.value)

// --- 模型 ---
const {
  selection, getProviderConfig, setProviderConfig, selectModel, providers, getProvider, currentModelOptions,
} = useModel()

const providerOptions = providers.map(p => ({ value: p.id, label: p.name }))
const modelOptions = computed(() => currentModelOptions())

// --- 优化目标 ---
const goal = ref<OptimizeGoal>('general')
const goalTabs = OPTIMIZE_GOALS.map(g => ({ id: g.id, label: g.label }))

// --- 模板 ---
const showTemplate = ref(false)
function applyTemplate(t: PromptTemplate) {
  draft.value = t.prompt
  showTemplate.value = false
}

// --- 自动保存 ---
const { draft, clearDraft } = useAutoSave()

// --- 优化 ---
const { result, loading, error: optimizeError, optimize, cancel, reset } = useOptimize()

async function handleOptimize() {
  if (!draft.value.trim()) return
  reset()
  await optimize(draft.value, goal.value)
}

// --- 复制 ---
const toastMessage = ref('')
const toastShow = ref(false)
function showToast(msg: string) {
  toastMessage.value = msg
  toastShow.value = true
}
async function copyResult() {
  try {
    await navigator.clipboard.writeText(result.value)
    showToast('已复制到剪贴板')
  } catch {
    showToast('复制失败')
  }
}

// --- 设置弹窗 ---
const showSettings = ref(false)
</script>

<template>
  <div :class="{ dark: dark }" class="min-h-screen">
    <div class="max-w-6xl mx-auto px-4 py-4 flex flex-col h-screen">
      <!-- Header -->
      <header class="flex items-center justify-between mb-3 flex-shrink-0">
        <div class="flex items-center gap-2">
          <AppIcon name="sparkles" class="text-blue-600" :size="24" />
          <h1 class="text-lg font-bold">Prompt Optimizer</h1>
        </div>
        <div class="flex items-center gap-2">
          <AppSelect
            :model-value="selection.providerId"
            :options="providerOptions"
            @update:model-value="(pid) => selectModel(pid, getProvider(pid)?.models[0] ?? '')"
          />
          <AppSelect
            v-if="modelOptions.length"
            :model-value="selection.modelId"
            :options="modelOptions"
            @update:model-value="(m) => selectModel(selection.providerId, m)"
          />
          <AppButton variant="ghost" size="sm" @click="showSettings = true">
            <AppIcon name="settings" :size="16" />
          </AppButton>
          <AppButton variant="ghost" size="sm" @click="toggleDark">
            <AppIcon :name="dark ? 'sun' : 'moon'" :size="16" />
          </AppButton>
        </div>
      </header>

      <!-- Goal Tabs -->
      <div class="flex items-center justify-between mb-3 flex-shrink-0">
        <AppTabs :tabs="goalTabs" :model-value="goal" @update:model-value="(v: string) => goal = v as OptimizeGoal" />
        <div class="flex items-center gap-2">
          <AppButton variant="secondary" size="sm" @click="showTemplate = !showTemplate">
            {{ showTemplate ? '收起模板' : '模板' }}
          </AppButton>
          <AppButton :loading="loading" :disabled="!draft.trim()" @click="handleOptimize">
            <AppIcon name="send" :size="16" />
            优化
          </AppButton>
          <AppButton v-if="loading" variant="ghost" size="sm" @click="cancel">取消</AppButton>
          <AppButton v-if="!loading && result" variant="ghost" size="sm" @click="clearDraft">清空</AppButton>
        </div>
      </div>

      <!-- 模板选择（折叠） -->
      <div v-if="showTemplate" class="mb-3 flex-shrink-0">
        <div class="flex flex-wrap gap-2">
          <button
            v-for="t in TEMPLATES"
            :key="t.id"
            @click="applyTemplate(t)"
            class="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-400 dark:hover:border-blue-500 text-left transition-colors"
          >
            <div class="text-xs font-medium text-gray-900 dark:text-gray-100">{{ t.name }}</div>
            <div class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{{ t.description }}</div>
          </button>
        </div>
      </div>

      <!-- Main Content -->
      <div class="flex-1 flex gap-4 min-h-0">
        <!-- Input Panel -->
        <div class="flex-1 flex flex-col">
          <div class="text-xs text-gray-500 dark:text-gray-400 mb-1.5 font-medium">输入提示词</div>
          <AppTextarea
            :model-value="draft"
            @update:model-value="draft = $event"
            placeholder="在这里输入或粘贴你的提示词..."
            class="flex-1 max-h-full"
          />
        </div>

        <!-- Output Panel -->
        <div class="flex-1 flex flex-col">
          <div class="text-xs text-gray-500 dark:text-gray-400 mb-1.5 font-medium">优化结果</div>
          <div
            class="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 p-4 overflow-y-auto font-mono text-sm leading-relaxed whitespace-pre-wrap"
          >
            <div v-if="!result && !loading && !optimizeError" class="text-gray-400 dark:text-gray-500 text-sm font-normal">
              点击"优化"开始
            </div>
            <div v-if="loading && !result" class="text-gray-400 dark:text-gray-500 animate-pulse">正在优化...</div>
            <div v-if="optimizeError" class="text-red-500">{{ optimizeError }}</div>
            {{ result }}
          </div>
          <div v-if="result && !loading" class="mt-2 flex justify-end">
            <AppButton size="sm" variant="secondary" @click="copyResult">
              <AppIcon name="copy" :size="14" />
              复制结果
            </AppButton>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="mt-3 text-center text-xs text-gray-400 dark:text-gray-600 flex-shrink-0">
        Prompt Optimizer v3 &mdash; 数据仅存储在本地浏览器
      </div>
    </div>

    <!-- Settings Modal -->
    <AppModal :show="showSettings" title="模型设置" @close="showSettings = false">
      <div class="space-y-4">
        <div v-for="p in providers" :key="p.id" class="pb-3 border-b border-gray-100 dark:border-gray-800 last:border-0">
          <div class="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1.5">{{ p.name }}</div>
          <input
            :value="getProviderConfig(p.id).apiKey"
            @input="setProviderConfig(p.id, { ...getProviderConfig(p.id), apiKey: ($event.target as HTMLInputElement).value })"
            type="password"
            placeholder="API Key"
            class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-xs text-gray-700 dark:text-gray-200 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
          />
          <input
            v-if="p.id === 'custom'"
            :value="getProviderConfig(p.id).baseUrl ?? ''"
            @input="setProviderConfig(p.id, { ...getProviderConfig(p.id), baseUrl: ($event.target as HTMLInputElement).value })"
            type="text"
            placeholder="Base URL (https://...)"
            class="mt-1.5 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-xs text-gray-700 dark:text-gray-200 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
          />
          <input
            v-if="p.id === 'custom'"
            :value="getProviderConfig(p.id).modelName ?? ''"
            @input="setProviderConfig(p.id, { ...getProviderConfig(p.id), modelName: ($event.target as HTMLInputElement).value })"
            type="text"
            placeholder="模型名称 (如 gpt-4o-mini)"
            class="mt-1.5 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-xs text-gray-700 dark:text-gray-200 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
          />
        </div>
      </div>
    </AppModal>

    <!-- Toast -->
    <AppToast :message="toastMessage" :show="toastShow" />
  </div>
</template>
```

- [ ] **Step 4: 创建 public/favicon.svg**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <text y=".9em" font-size="90">✨</text>
</svg>
```

- [ ] **Step 5: 验证构建**

```bash
pnpm build
```
Expected: 构建成功。确认 `dist/` 目录生成，包含 `index.html` + JS/CSS 资源。

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: add main App.vue, entry files, and favicon"
```

---

### Task 12: 部署配置 + 清理旧文件

**Files:**
- Create: `vercel.json`
- Delete: 所有未被使用的旧配置文件

- [ ] **Step 1: 创建 vercel.json**

```json
{
  "buildCommand": "pnpm build",
  "outputDirectory": "dist",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

- [ ] **Step 2: 清理不再需要的顶层文件**

```bash
# 重新确认旧项目文件已删除
rm -f .npmrc middleware.js wrangler.jsonc playwright.config.ts Dockerfile .dockerignore

# 清理 docs 中不相关的目录（保留 docs/superpowers 等有用文档）
# 选择性保留
```

- [ ] **Step 3: 确认构建成功**

```bash
pnpm build
ls -la dist/
```
Expected: `dist/index.html` + `dist/assets/` 包含编译产物。dist 总大小 < 200KB。

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "chore: add Vercel deploy config and final cleanup"
```

---

## 构建和验证

完成所有 task 后，执行以下验证：

```bash
# 1. 完整构建
pnpm build

# 2. 检查 dist 产物
du -sh dist/
ls -la dist/assets/

# 3. 启动 dev server
pnpm dev
```

Expected: 构建产物 < 200KB，dev server 启动后浏览器打开可见页面，可正常输入、选择模型、优化。
