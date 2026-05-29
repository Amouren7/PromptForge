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
