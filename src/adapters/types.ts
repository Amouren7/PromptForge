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
