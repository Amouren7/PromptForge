<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{ message: string; show: boolean }>()
const visible = ref(false)
let timer: ReturnType<typeof setTimeout>

watch(() => props.show, (val) => {
  if (val) {
    visible.value = true
    clearTimeout(timer)
    timer = setTimeout(() => { visible.value = false }, 2500)
  }
})
</script>

<template>
  <Teleport to="body">
    <Transition name="toast">
      <div v-if="visible" class="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-lg bg-gray-900 dark:bg-gray-700 text-white text-sm shadow-lg">
        {{ message }}
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.toast-enter-active, .toast-leave-active { transition: all 0.3s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translate(-50%, 10px); }
</style>
