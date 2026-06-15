import { ref, watch } from 'vue'
import { useConfigStore } from '@/stores/config-store'
import type { OutputFormat } from '@/types/OutputFormats'

export function useOutputFormats() {
  const configStore = useConfigStore()

  const outputFormats: OutputFormat[] = [
    { label: 'Excel (xlsx)', value: 'xlsx', display: 'xlsx' },
    { label: 'Comma Separated Values (csv)', value: 'csv', display: 'csv' },
    { label: 'JSON Lines (jsonl)', value: 'jsonl', display: 'jsonl' },
  ]

  const selectedOutputs = ref<OutputFormat[]>(
    outputFormats.filter((fmt) => {
      const formats = configStore.config.scan.formats
      return formats[fmt.value as keyof typeof formats]
    })
  )

  const isFormatSelected = (fmt: OutputFormat): boolean => {
    return selectedOutputs.value.some((s) => s.value === fmt.value)
  }

  const toggleFormat = (fmt: OutputFormat) => {
    if (isFormatSelected(fmt)) {
      selectedOutputs.value = selectedOutputs.value.filter((s) => s.value !== fmt.value)
    } else {
      selectedOutputs.value.push(fmt)
    }
  }

  watch(
    selectedOutputs,
    (newVal) => {
      configStore.config.scan.formats.csv = newVal.some((f) => f.value === 'csv')
      configStore.config.scan.formats.jsonl = newVal.some((f) => f.value === 'jsonl')
      configStore.config.scan.formats.xlsx = newVal.some((f) => f.value === 'xlsx')
    },
    { deep: true }
  )

  return {
    outputFormats,
    selectedOutputs,
    isFormatSelected,
    toggleFormat,
  }
}
