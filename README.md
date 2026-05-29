# PromptForge

AI prompt optimizer — 文本与文生图提示词优化，多模型支持，轻量纯前端。

一个轻量、高效的 AI 提示词优化工具。输入原始提示词，选择优化目标，一键获得更高质量的提示词。

> 本项目重构自 [linshenkx/prompt-optimizer](https://github.com/linshenkx/prompt-optimizer/tree/develop) 开源项目。
> 原项目功能完整但体积较大（含 monorepo、Chrome 扩展、Electron 桌面端、MCP 服务器、多语言等），
> 此重构版本聚焦核心优化能力，去除复杂依赖，打造更轻量、更简洁的优化体验。

---

## 使用说明

### 1. 配置 API Key

使用前需要配置至少一个 LLM 提供商的 API Key。

**方式一：环境变量（推荐）**

复制 `env.example` 为 `.env` 并填入密钥：

```
VITE_OPENAI_API_KEY=sk-your-key-here
VITE_GEMINI_API_KEY=your-key-here
VITE_ANTHROPIC_API_KEY=sk-ant-your-key-here
VITE_DEEPSEEK_API_KEY=sk-your-key-here
```

**方式二：页面设置**

启动后在页面右上角点击 ⚙️ 按钮，在弹窗中填入对应提供商的 API Key，会自动保存到浏览器本地存储。

### 2. 选择模型

页面顶部左侧下拉框选择 LLM 提供商，右侧选择具体模型。

### 3. 输入提示词

在左侧输入框中粘贴或输入需要优化的原始提示词。

### 4. 选择优化目标

通过标签页选择优化方向：

| 文本优化 | 说明 |
|---------|------|
| 通用优化 | 全面优化提示词清晰度和有效性 |
| 更专业 | 转为正式、专业的商务风格 |
| 更简洁 | 精简冗余，保留核心指令 |
| 加结构 | 增加角色定义、分段指令、格式约束 |
| 加示例 | 补充 Few-shot 示例增强效果 |
| 深度优化 | 综合运用角色链、思维链等多种高级技巧 |

| 文生图优化 | 说明 |
|-----------|------|
| 图像·通用 | 按主体→环境→风格→细节重建画面描述 |
| 图像·丰富细节 | 补充光影、构图、材质、色彩等视觉细节 |
| 图像·风格强化 | 强化艺术风格、艺术家参考和媒介表现 |

### 5. 开始优化

点击「优化」按钮，右侧面板会实时流式显示优化结果。优化后可点击「复制结果」使用。

### 6. 使用模板

点击「模板」按钮展开预设模板面板，点击任意模板即可将模板内容填入输入框。

### 7. 其他功能

- **暗色模式**：右上角 🌙/☀️ 按钮切换
- **自动保存**：输入框内容自动保存到浏览器本地，刷新不会丢失
- **清空**：有优化结果后，可点击「清空」恢复初始状态

## 构建部署

```bash
# 安装依赖
pnpm install

# 开发
pnpm dev

# 构建
pnpm build        # 输出到 dist/

# 预览构建结果
pnpm preview
```

构建产物在 `dist/` 目录，可直接部署到 Vercel、Cloudflare Pages、Nginx 等任意静态托管服务。

## 技术栈

- Vue 3 + TypeScript + Tailwind CSS 4 + Vite 8
- 单页面应用，无 monorepo，无后端依赖
- LLM SDK：OpenAI、@google/genai、@anthropic-ai/sdk
- 支持 OpenAI 兼容接口（DeepSeek、Grok、智谱、SiliconFlow 等）

## 支持的提供商

| 提供商 | 适配器 | 默认模型 |
|--------|--------|---------|
| OpenAI | openai | gpt-4o, gpt-4o-mini, o3-mini |
| DeepSeek | openai 兼容 | deepseek-chat, deepseek-reasoner |
| Grok (xAI) | openai 兼容 | grok-2, grok-3-beta |
| 智谱 | openai 兼容 | glm-4-plus, glm-4-air |
| SiliconFlow | openai 兼容 | DeepSeek-V3, DeepSeek-R1, Qwen2.5-72B |
| 自定义(兼容) | openai 兼容 | 自定义模型名称 |
| Gemini | gemini | gemini-2.5-flash, gemini-2.0-flash |
| Anthropic | anthropic | claude-sonnet-4, claude-haiku-3.5 |

## License

AGPL-3.0
