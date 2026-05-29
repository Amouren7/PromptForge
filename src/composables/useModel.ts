import { reactive } from 'vue'
import { storage } from '../utils/storage'
import { PROVIDERS } from '../adapters/types'
import { readStandardEnvApiKeys, scanCustomModelsFromEnv } from '../utils/env'
import type { ProviderConfig, ModelSelection } from '../types'
import type { ProviderDef } from '../types'

const STORAGE_KEY = 'model_config'

interface ModelState {
  configs: Record<string, ProviderConfig>
  selection: ModelSelection
}

function defaultState(): ModelState {
  return {
    configs: {},
    selection: { providerId: 'openai', modelId: import.meta.env.VITE_OPENAI_MODEL || 'gpt-5.5' },
  }
}

const state = reactive<ModelState>(storage.get<ModelState>(STORAGE_KEY) ?? defaultState())

function persist() {
  storage.set(STORAGE_KEY, { configs: state.configs, selection: state.selection })
}

/** 合并 env var API Keys 和 localStorage 配置：env vars 作为默认值，localStorage 覆盖 */
function mergedProviderConfig(providerId: string): ProviderConfig {
  const saved = state.configs[providerId]
  const envKeys = readStandardEnvApiKeys()
  const envKey = envKeys[providerId] || ''

  // 如果 localStorage 有值，优先使用（可能是用户在界面修改过的）
  if (saved?.apiKey) return saved
  // 否则使用 env var（如果有）
  if (envKey) return { apiKey: envKey }

  return saved ?? { apiKey: '' }
}

/** 构建完整的提供商列表（静态 + 动态自定义） */
function buildAllProviders(): ProviderDef[] {
  // .map creates mutable copies (PROVIDERS is `as const` so we need to unwrap readonly)
  const providers: ProviderDef[] = PROVIDERS.map(p => ({ ...p, models: [...p.models] }))
  const customModels = scanCustomModelsFromEnv()

  for (const cm of customModels) {
    providers.push({
      id: `custom_${cm.suffix}`,
      name: cm.suffix.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      adapter: 'openai',
      baseUrl: cm.baseUrl,
      models: [cm.modelName],
    })
  }

  return providers
}

export function useModel() {
  function getProviderConfig(providerId: string): ProviderConfig {
    return mergedProviderConfig(providerId)
  }

  function setProviderConfig(providerId: string, config: ProviderConfig) {
    state.configs[providerId] = config
    persist()
  }

  function selectModel(providerId: string, modelId: string) {
    state.selection.providerId = providerId
    state.selection.modelId = modelId
    persist()
  }

  function getProvider(id: string) {
    return buildAllProviders().find(p => p.id === id)
  }

  const currentProvider = () => getProvider(state.selection.providerId)

  const currentModelId = () => {
    if (state.selection.providerId === 'custom' || state.selection.providerId.startsWith('custom_')) {
      return state.configs[state.selection.providerId]?.modelName || ''
    }
    return state.selection.modelId
  }

  const currentModelOptions = () => {
    if (state.selection.providerId === 'custom' || state.selection.providerId.startsWith('custom_')) {
      const name = state.configs[state.selection.providerId]?.modelName
      return name ? [{ value: name, label: name }] : []
    }
    const p = getProvider(state.selection.providerId)
    return (p?.models ?? []).map(m => ({ value: m, label: m }))
  }

  /** 获取完整的动态提供商列表 */
  const allProviders = () => buildAllProviders()

  /** 获取所有提供商的合并配置（含 env var 默认值），用于设置界面 */
  function getAllProviderConfigs(): Record<string, ProviderConfig> {
    const envKeys = readStandardEnvApiKeys()
    const result: Record<string, ProviderConfig> = { ...state.configs }

    // 补充 env var 中有但 localStorage 没有的 key
    for (const [id, key] of Object.entries(envKeys)) {
      if (!result[id]?.apiKey) {
        result[id] = { apiKey: key }
      }
    }

    return result
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
    allProviders,
    getAllProviderConfigs,
  }
}
