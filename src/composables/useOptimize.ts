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
        baseUrl: config.baseUrl || (provider as { baseUrl?: string }).baseUrl,
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
