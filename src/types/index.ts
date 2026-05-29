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
  | 'advanced'
  | 'image_general'
  | 'image_detail'
  | 'image_style'

export const OPTIMIZE_GOALS: { id: OptimizeGoal; label: string; prompt: string }[] = [
  { id: 'general', label: '通用优化', prompt: '对以下提示词进行全面优化，使其更清晰、更有效，保留原始意图。' },
  { id: 'professional', label: '更专业', prompt: '使以下提示词更加专业、正式，适合商务和专业场景。' },
  { id: 'concise', label: '更简洁', prompt: '精简以下提示词，保留核心指令，去除冗余表达。' },
  { id: 'structured', label: '加结构', prompt: '为以下提示词增加结构化元素：角色定义、分段指令、输出格式约束。' },
  { id: 'examples', label: '加示例', prompt: '在以下提示词中补充输入/输出示例，用 Few-shot 方式增强可理解性。' },
  { id: 'advanced', label: '深度优化', prompt: '综合运用角色链、思维链、正反例等多种高级技巧进行深度优化。' },
  { id: 'image_general', label: '图像·通用', prompt: '对文生图提示词进行全面优化，使其更具体、更富画面感。' },
  { id: 'image_detail', label: '图像·丰富细节', prompt: '为文生图提示词补充光影、构图、材质等视觉细节。' },
  { id: 'image_style', label: '图像·风格强化', prompt: '强化文生图提示词的艺术风格、艺术家参考和媒介表现。' },
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
