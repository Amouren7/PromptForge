import { watch, ref } from 'vue'
import { storage } from '../utils/storage'

const STORAGE_KEY = 'draft'

export function useAutoSave() {
  const draft = ref(storage.get<string>(STORAGE_KEY) ?? '')

  let timer: ReturnType<typeof setTimeout> | null = null
  watch(draft, (val) => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      storage.set(STORAGE_KEY, val)
    }, 500)
  })

  function clearDraft() {
    draft.value = ''
    storage.remove(STORAGE_KEY)
  }

  return { draft, clearDraft }
}
