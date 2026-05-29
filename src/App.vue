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
// 初始化时设置正确的 class
if (dark.value) {
  document.documentElement.classList.add('dark')
} else {
  document.documentElement.classList.remove('dark')
}

// --- 模型 ---
const {
  selection, getProviderConfig, setProviderConfig, selectModel, getProvider, currentModelOptions, allProviders, getAllProviderConfigs,
} = useModel()

const providerOptions = computed(() => allProviders().map(p => ({ value: p.id, label: p.name })))
const modelOptions = computed(() => currentModelOptions())

// --- 优化目标 ---
const goal = ref<OptimizeGoal>('general')
const goalTabs = computed(() => OPTIMIZE_GOALS.map(g => ({ id: g.id, label: g.label })))

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

// --- 处理提供商切换时自动选中第一个模型 ---
function onProviderChange(providerId: string) {
  const p = getProvider(providerId)
  const firstModel = p?.models?.[0] ?? ''
  selectModel(providerId, firstModel)
}
</script>

<template>
  <div :class="{ dark: dark }" class="min-h-screen">
    <div class="max-w-7xl mx-auto px-4 py-4 flex flex-col h-screen">
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
            @update:model-value="onProviderChange"
          />
          <AppSelect
            v-if="modelOptions.length"
            :model-value="selection.modelId"
            :options="modelOptions"
            @update:model-value="(m: string) => selectModel(selection.providerId, m)"
          />
          <AppButton variant="ghost" size="sm" @click="showSettings = true">
            <AppIcon name="settings" :size="16" />
          </AppButton>
          <AppButton variant="ghost" size="sm" @click="toggleDark">
            <AppIcon :name="dark ? 'sun' : 'moon'" :size="16" />
          </AppButton>
        </div>
      </header>

      <!-- Goal Tabs + Action Bar -->
      <div class="flex flex-wrap items-center gap-2 mb-3 flex-shrink-0">
        <AppTabs :tabs="goalTabs" :model-value="goal" @update:model-value="(v: string) => goal = v as OptimizeGoal" class="flex-1 min-w-0" />
        <div class="flex items-center gap-2 flex-shrink-0">
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

      <!-- 模板选择（折叠面板） -->
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

      <!-- Main Content: Left-Right Split -->
      <div class="flex-1 flex gap-4 min-h-0">
        <!-- Input Panel -->
        <div class="flex-1 flex flex-col">
          <div class="text-xs text-gray-500 dark:text-gray-400 mb-1.5 font-medium">输入提示词</div>
          <AppTextarea
            :model-value="draft"
            @update:model-value="draft = $event"
            placeholder="在这里输入或粘贴你的提示词..."
            class="flex-1"
            :style="{ maxHeight: '100%' }"
          />
        </div>

        <!-- Output Panel -->
        <div class="flex-1 flex flex-col">
          <div class="text-xs text-gray-500 dark:text-gray-400 mb-1.5 font-medium">优化结果</div>
          <div
            class="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 p-4 overflow-y-auto font-mono text-sm leading-relaxed whitespace-pre-wrap"
          >
            <div v-if="!result && !loading && !optimizeError" class="text-gray-400 dark:text-gray-500 font-sans">
              点击"优化"开始
            </div>
            <div v-if="loading && !result" class="text-gray-400 dark:text-gray-500 animate-pulse font-sans">正在优化...</div>
            <div v-if="optimizeError" class="text-red-500 font-sans">{{ optimizeError }}</div>
            {{ result }}
          </div>
          <div v-if="result && !loading" class="mt-2 flex justify-end flex-shrink-0">
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
        <div v-for="p in allProviders()" :key="p.id" class="pb-3 border-b border-gray-100 dark:border-gray-800 last:border-0">
          <div class="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1.5">{{ p.name }}</div>
          <input
            :value="getProviderConfig(p.id).apiKey"
            @input="setProviderConfig(p.id, { ...getProviderConfig(p.id), apiKey: ($event.target as HTMLInputElement).value })"
            type="password"
            placeholder="API Key"
            class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-xs text-gray-700 dark:text-gray-200 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
          />
          <input
            v-if="p.id.startsWith('custom')"
            :value="getProviderConfig(p.id).baseUrl ?? ''"
            @input="setProviderConfig(p.id, { ...getProviderConfig(p.id), baseUrl: ($event.target as HTMLInputElement).value })"
            type="text"
            placeholder="Base URL (https://...)"
            class="mt-1.5 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-xs text-gray-700 dark:text-gray-200 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
          />
          <input
            v-if="p.id.startsWith('custom')"
            :value="getProviderConfig(p.id).modelName ?? ''"
            @input="setProviderConfig(p.id, { ...getProviderConfig(p.id), modelName: ($event.target as HTMLInputElement).value })"
            type="text"
            placeholder="模型名称"
            class="mt-1.5 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-xs text-gray-700 dark:text-gray-200 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
          />
        </div>
      </div>
    </AppModal>

    <!-- Toast -->
    <AppToast :message="toastMessage" :show="toastShow" />
  </div>
</template>
