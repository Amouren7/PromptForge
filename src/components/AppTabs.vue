<script setup lang="ts">
defineProps<{
  tabs: { id: string; label: string }[]
  modelValue: string
}>()
defineEmits<{ 'update:modelValue': [value: string] }>()
</script>

<template>
  <div class="flex flex-wrap gap-1 rounded-lg bg-gray-100 dark:bg-gray-800 p-1" role="tablist">
    <button
      v-for="tab in tabs"
      :key="tab.id"
      role="tab"
      :aria-selected="modelValue === tab.id"
      @click="$emit('update:modelValue', tab.id)"
      :class="[
        'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
        modelValue === tab.id
          ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200',
      ]"
    >
      {{ tab.label }}
    </button>
  </div>
</template>
