import type { LLMAdapter } from '../types'

export interface AdapterModule {
  default: LLMAdapter
}

/** 适配器注册表：按 providerId 动态加载适配器 */
export type AdapterLoader = () => Promise<AdapterModule>

/** 所有支持的提供商定义 */
export const PROVIDERS = [
  { id: 'openai', name: 'OpenAI', adapter: 'openai', models: ['gpt-5.5', 'gpt-5.4', 'o3'] },
  { id: 'deepseek', name: 'DeepSeek', adapter: 'openai', baseUrl: 'https://api.deepseek.com/v1', models: ['deepseek-v4-pro', 'deepseek-v4-flash', 'deepseek-r1-0528'] },
  { id: 'grok', name: 'Grok (xAI)', adapter: 'openai', baseUrl: 'https://api.x.ai/v1', models: ['grok-4.3', 'grok-4.20', 'grok-build-0.1'] },
  { id: 'zhipu', name: '智谱', adapter: 'openai', baseUrl: 'https://open.bigmodel.cn/api/paas/v4', models: ['glm-5.1', 'glm-5', 'glm-5-turbo'] },
  { id: 'siliconflow', name: 'SiliconFlow', adapter: 'openai', baseUrl: 'https://api.siliconflow.cn/v1', models: ['deepseek-ai/DeepSeek-V3.2', 'deepseek-ai/DeepSeek-R1-0528', 'Qwen/Qwen3-235B-A22B'] },
  { id: 'custom', name: '自定义(兼容)', adapter: 'openai', baseUrl: '', models: [] },
  { id: 'gemini', name: 'Gemini', adapter: 'gemini', models: ['gemini-3.1-pro', 'gemini-3.1-flash', 'gemini-2.5-flash'] },
  { id: 'anthropic', name: 'Anthropic', adapter: 'anthropic', models: ['claude-opus-4-8', 'claude-sonnet-4-6', 'claude-haiku-3-5-20241022'] },
] as const
