# PromptForge

AI prompt optimizer — 文本与文生图提示词优化，多模型支持，轻量纯前端。

PromptForge 是一个轻量、高效的 AI 提示词优化工具。输入原始提示词，选择优化目标，一键获得更高质量的提示词。支持流式输出，所有数据仅存储在本地。

> 本项目重构自 [linshenkx/prompt-optimizer](https://github.com/linshenkx/prompt-optimizer/tree/develop) 开源项目。
> 原项目功能完整但体积较大（含 monorepo、Chrome 扩展、Electron 桌面端、MCP 服务器、多语言等），
> 此重构版本聚焦核心优化能力，去除复杂依赖，打造更轻量、更简洁的优化体验。

---

## 项目结构

```
PromptForge/
├── src/
│   ├── adapters/          # LLM 适配器（动态加载）
│   │   ├── openai.ts      # OpenAI 及兼容接口
│   │   ├── gemini.ts      # Google Gemini
│   │   ├── anthropic.ts   # Anthropic Claude
│   │   ├── registry.ts    # 适配器注册表
│   │   └── types.ts       # 提供商定义
│   ├── components/        # UI 组件
│   │   ├── AppButton.vue
│   │   ├── AppIcon.vue
│   │   ├── AppModal.vue
│   │   ├── AppSelect.vue
│   │   ├── AppTabs.vue
│   │   ├── AppTextarea.vue
│   │   └── AppToast.vue
│   ├── composables/       # 状态管理
│   │   ├── useAutoSave.ts # 自动保存草稿
│   │   ├── useModel.ts    # 模型配置与选择
│   │   └── useOptimize.ts # 优化流程
│   ├── optimization/
│   │   └── prompts.ts     # 优化提示词（每条目标含分析+优化+输出三步）
│   ├── templates/
│   │   └── index.ts       # 6 种内置模板
│   ├── types/
│   │   └── index.ts       # TypeScript 类型定义
│   ├── utils/
│   │   ├── env.ts         # 环境变量读取
│   │   └── storage.ts     # localStorage 封装
│   ├── App.vue            # 主页面
│   ├── main.ts            # 入口
│   └── style.css          # Tailwind 样式
├── .env.example           # 环境变量示例
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
└── vercel.json            # Vercel 部署配置
```

## 使用说明

### 1. 安装依赖

```bash
pnpm install
```

> 本项目使用 pnpm。如未安装：`npm install -g pnpm`

### 2. 配置 API Key

使用前需至少配置一个 LLM 提供商的 API Key。支持两种方式：

#### 方式一：.env 文件（推荐）

复制环境变量示例文件并填入你的密钥：

```bash
cp .env.example .env
```

支持以下环境变量：
注：由于重构时信息比较老，所以没有应用到最新的默认模型，这里建议自行配置“自定义兼容商”

| 变量名 | 说明 |
|--------|------|
| `VITE_OPENAI_API_KEY` | OpenAI API Key |
| `VITE_OPENAI_MODEL` | OpenAI 默认模型（可选，默认 gpt-4o） |
| `VITE_GEMINI_API_KEY` | Google Gemini API Key |
| `VITE_ANTHROPIC_API_KEY` | Anthropic Claude API Key |
| `VITE_DEEPSEEK_API_KEY` | DeepSeek API Key |
| `VITE_GROK_API_KEY` | Grok (xAI) API Key |
| `VITE_ZHIPU_API_KEY` | 智谱 API Key |
| `VITE_SILICONFLOW_API_KEY` | SiliconFlow API Key |
| `VITE_CUSTOM_API_KEY_<name>` | 自定义 OpenAI 兼容提供商 Key |
| `VITE_CUSTOM_API_BASE_URL_<name>` | 自定义提供商地址 |
| `VITE_CUSTOM_API_MODEL_<name>` | 自定义提供商模型名 |

自定义提供商示例：

```
VITE_CUSTOM_API_KEY_MYPROVIDER=sk-xxx
VITE_CUSTOM_API_BASE_URL_MYPROVIDER=https://api.example.com/v1
VITE_CUSTOM_API_MODEL_MYPROVIDER=gpt-4o
```

#### 方式二：页面设置（浏览器 UI）

启动后在页面右上角点击 ⚙️ 按钮，在弹窗中填入对应提供商的 API Key。这种方式会保存到浏览器 localStorage，不会保存在服务器上。

> **优先级**：页面设置的 Key 优先于 `.env` 文件中的 Key。

### 3. 启动开发服务器

```bash
pnpm dev
```

启动后终端会显示访问地址，通常是 `http://localhost:5173`。如果没有自动打开浏览器，手动复制地址访问即可。

### 4. 选择模型

启动后在页面顶部左侧下拉框选择 LLM 提供商（如 OpenAI、Gemini、Anthropic 等），右侧下拉框选择具体模型（如 gpt-4o、claude-sonnet-4 等）。

### 5. 输入提示词

在左侧编辑区输入或粘贴需要优化的原始提示词。编辑的内容会自动保存到浏览器本地存储，刷新页面不会丢失。

### 6. 选择优化目标

通过标签页选择优化方向，共 9 种选择：

#### 文本提示词优化

| 目标 | 说明 |
|------|------|
| **通用优化** | 全面优化提示词清晰度和有效性 |
| **更专业** | 转为正式、专业的商务风格 |
| **更简洁** | 精简冗余，保留核心指令，控制在原长度 40%-70% |
| **加结构** | 增加角色定义、分段指令、格式约束 |
| **加示例** | 补充 Few-shot 示例增强可理解性 |
| **深度优化** | 综合运用角色链、思维链、正反例等多种高级技巧 |

#### 文生图提示词优化

| 目标 | 说明 |
|------|------|
| **图像·通用** | 按"主体→环境→风格→细节"顺序重建画面描述，输出英文 |
| **图像·丰富细节** | 补充光影、构图、材质、色彩等视觉细节 |
| **图像·风格强化** | 强化艺术风格、艺术家参考和媒介表现 |

> 文生图优化输出为英文提示词（主流图像生成工具对英文理解最佳）。

### 7. 开始优化

点击「优化」按钮，右侧面板会实时流式显示优化结果。结果分为两部分：

- **[分析]**：AI 对原始提示词的优缺点分析
- **[优化后的提示词]**：可直接使用的优化结果

如需停止，点击「取消」按钮中止生成。

### 8. 使用模板

点击「模板」按钮展开预设模板面板，点击任意模板即可将内容填入输入框。

内置 6 种模板：角色扮演、分析、写作、头脑风暴、摘要总结、代码审查。

### 9. 其他功能

- **暗色模式**：右上角 🌙/☀️ 按钮切换，状态自动保存
- **复制结果**：优化完成后点击「复制结果」一键复制到剪贴板
- **清空**：点击「清空」清理优化结果，回到初始状态

## 构建部署

### 构建生产版本

```bash
pnpm build
```

构建输出在 `dist/` 目录：
```
dist/
├── index.html              # ~0.5 KB
├── assets/
│   ├── index-xxxxx.css     # ~20 KB (gzip ~5 KB)
│   ├── index-xxxxx.js      # ~109 KB (gzip ~42 KB)
│   ├── openai-xxxxx.js     # ~104 KB (gzip ~28 KB) — 按需加载
│   ├── gemini-xxxxx.js     # ~257 KB (gzip ~51 KB) — 按需加载
│   └── anthropic-xxxxx.js  # ~72 KB (gzip ~20 KB) — 按需加载
```

> LLM 适配器（openai/gemini/anthropic）通过动态 `import()` 按需加载，仅在首次使用对应模型时加载。

### 预览构建结果

```bash
pnpm preview
```

### 部署到 Vercel

项目已包含 `vercel.json`，直接导入部署：

1. Fork 或推送代码到 GitHub
2. 在 Vercel 导入项目
3. 构建设置会自动读取 `vercel.json`（build: `pnpm build`，output: `dist`）
4. 在 Vercel 项目设置中配置环境变量（如 `VITE_OPENAI_API_KEY`）

### 部署到 Cloudflare Pages

1. 连接 GitHub 仓库
2. 构建命令：`pnpm build`
3. 输出目录：`dist`

### 部署到 Nginx

```nginx
server {
    listen       80;
    server_name  your-domain.com;
    root         /path/to/dist;
    index        index.html;

    # SPA 路由重写
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

## 支持的 LLM 提供商
注：由于重构时信息比较老，所以没有应用到最新的默认模型，这里建议自行配置“自定义兼容商”
| 提供商 | 适配器类型 | 默认模型 | 地址 |
|--------|-----------|---------|------|
| OpenAI | openai | gpt-4o, gpt-4o-mini, o3-mini | api.openai.com |
| DeepSeek | openai 兼容 | deepseek-chat, deepseek-reasoner | api.deepseek.com |
| Grok (xAI) | openai 兼容 | grok-2, grok-3-beta | api.x.ai |
| 智谱 | openai 兼容 | glm-4-plus, glm-4-air | open.bigmodel.cn |
| SiliconFlow | openai 兼容 | DeepSeek-V3, DeepSeek-R1, Qwen2.5-72B | api.siliconflow.cn |
| 自定义(OpenAI 兼容) | openai 兼容 | 自定义 | 自定义 |
| Gemini | gemini | gemini-2.5-flash, gemini-2.0-flash, gemini-1.5-flash | generativelanguage.googleapis.com |
| Anthropic | anthropic | claude-sonnet-4-20250514, claude-haiku-3-5-sonnet-20241022 | api.anthropic.com |

> **自定义提供商**：支持任意 OpenAI 兼容接口（如 Ollama、OneAPI、vLLM 等），在设置中填写 Base URL 和模型名称即可。

## 常见问题

### API 连接失败

1. **检查 API Key 是否正确配置**：确认 `.env` 文件或页面设置中的 Key 有效
2. **CORS 限制**：浏览器可能阻止跨域请求。如遇此问题可使用 Docker 部署或本地代理
3. **网络问题**：确认可访问对应 API 服务（部分区域需要代理）

### 编译错误

```bash
# 清除缓存后重试
rm -rf dist/ .vite/ node_modules/.vite
pnpm install
pnpm build
```

## 技术栈

| 技术 | 说明 |
|------|------|
| Vue 3.5 | 前端框架（Composition API + `<script setup>`） |
| TypeScript 5.9 | 类型安全 |
| Tailwind CSS 4 | 样式（暗色模式通过 CSS 变量实现） |
| Vite 8 | 构建工具（HMR、代码分割） |
| OpenAI SDK 6 | OpenAI 及兼容接口适配 |
| @google/genai 1.46 | Gemini 适配 |
| @anthropic-ai/sdk 0.80 | Anthropic Claude 适配 |

架构特点：
- **单页面应用**，无 monorepo，无后端依赖
- **适配器模式**：统一 `stream()` 和 `complete()` 接口
- **动态加载**：LLM SDK 仅在使用时加载
- **Composable 状态管理**：无 Vuex/Pinia，纯 reactive + localStorage
- **流式输出**：AsyncGenerator 逐 token 渲染

## 演示效果

<img width="1919" height="979" alt="主界面" src="https://github.com/user-attachments/assets/31478334-1e3a-4ae7-84ac-daf3d35a2062" />
<img width="1919" height="946" alt="设置面板" src="https://github.com/user-attachments/assets/9f15da31-eb17-4d32-b555-303cb433fe6f" />
<img width="1909" height="951" alt="优化结果" src="https://github.com/user-attachments/assets/35573e9d-b509-4bbf-9b3b-45df8531bc4f" />

## License

AGPL-3.0
