/** 标准提供商 env var 映射表 */
const PROVIDER_ENV_MAP: Record<string, { key: string }> = {
  openai: { key: 'VITE_OPENAI_API_KEY' },
  gemini: { key: 'VITE_GEMINI_API_KEY' },
  deepseek: { key: 'VITE_DEEPSEEK_API_KEY' },
  grok: { key: 'VITE_GROK_API_KEY' },
  zhipu: { key: 'VITE_ZHIPU_API_KEY' },
  siliconflow: { key: 'VITE_SILICONFLOW_API_KEY' },
  anthropic: { key: 'VITE_ANTHROPIC_API_KEY' },
}

/** 自定义模型 env var 前缀 */
const CUSTOM_PREFIX = 'VITE_CUSTOM_API_KEY_'
const CUSTOM_BASE_URL_PREFIX = 'VITE_CUSTOM_API_BASE_URL_'
const CUSTOM_MODEL_PREFIX = 'VITE_CUSTOM_API_MODEL_'

export interface EnvCustomModel {
  suffix: string
  apiKey: string
  baseUrl: string
  modelName: string
}

/** 从 import.meta.env 读取标准提供商的 API Key */
export function readStandardEnvApiKeys(): Record<string, string> {
  const result: Record<string, string> = {}
  for (const [providerId, { key }] of Object.entries(PROVIDER_ENV_MAP)) {
    const val = (import.meta.env as any)[key]
    if (val && typeof val === 'string' && val.trim()) {
      result[providerId] = val.trim()
    }
  }
  return result
}

/** 扫描环境变量中的自定义模型 */
export function scanCustomModelsFromEnv(): EnvCustomModel[] {
  const env = import.meta.env as Record<string, string>
  const models: EnvCustomModel[] = []

  for (const key of Object.keys(env)) {
    const match = key.match(new RegExp(`^${CUSTOM_PREFIX}(.+)$`))
    if (!match) continue

    const suffix = match[1]
    const apiKey = env[key]
    const baseUrl = env[`${CUSTOM_BASE_URL_PREFIX}${suffix}`]
    const modelName = env[`${CUSTOM_MODEL_PREFIX}${suffix}`]

    if (apiKey && baseUrl && modelName) {
      models.push({ suffix, apiKey, baseUrl, modelName })
    }
  }

  return models
}
