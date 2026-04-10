import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useErrorStore = defineStore('error', () => {
  const hasError = ref(false)
  const errorTitle = ref('')
  const errorMessage = ref('')
  const errorSuggestion = ref('')

  function showError(title: string, message: string, suggestion: string) {
    errorTitle.value = title
    errorMessage.value = message
    errorSuggestion.value = suggestion
    hasError.value = true
  }

  function clearError() {
    hasError.value = false
    // we don't clear the text immediately so the exit animation looks clean
  }

  return {
    hasError,
    errorTitle,
    errorMessage,
    errorSuggestion,
    showError,
    clearError,
  }
})
