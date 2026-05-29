<script setup lang="ts">
defineProps<{
  modelValue: string
  options: { value: string; label: string }[]
  label?: string
}>()
defineEmits<{ 'update:modelValue': [value: string] }>()
</script>

<template>
  <div class="flex items-center gap-2">
    <label v-if="label" class="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{{ label }}</label>
    <select
      :value="modelValue"
      @change="$emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
      class="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-colors"
    >
      <option v-for="opt in options" :key="opt.value" :value="opt.value" :disabled="!opt.value">{{ opt.label }}</option>
    </select>
  </div>
</template>
