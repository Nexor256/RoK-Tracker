import { defineStore } from 'pinia'
import type { BatchAdditionalData } from 'src/schema/BatchAdditionalData'
import type { BatchGovernorData } from 'src/schema/BatchGovernorData'
import { ref } from 'vue'

function defaultLastGovernor(): BatchGovernorData[] {
  return [
    { name: 'Governor 1', img_path: '', score: 400 },
    { name: 'Governor 2', img_path: '', score: 400 },
    { name: 'Governor 3', img_path: '', score: 400 },
    { name: 'Governor 4', img_path: '', score: 400 },
    { name: 'Governor 5', img_path: '', score: 400 },
  ]
}

/**
 * Shared store definition for the Alliance/Honor/Seed batch scanners.
 * They all track the same shape of state (last scanned governors, scan
 * status, running/disabled flags), only the pinia store id differs.
 */
export function createBatchStore(storeId: string) {
  return defineStore(storeId, () => {
    const lastGovernor = ref<BatchGovernorData[]>(defaultLastGovernor())

    const status = ref<BatchAdditionalData>({
      current_page: 1,
      govs_per_page: 5,
      target_governor: 20,
      remaining_sec: 0,
      current_time: new Date().toISOString(),
    })

    const scanID = ref('Scan id')

    const statusMessage = ref('Not yet started')

    const scanRunning = ref(false)
    const startButtonDisabled = ref(false)

    return {
      lastGovernor,
      status,
      statusMessage,
      scanID,
      scanRunning,
      startButtonDisabled,
    }
  })
}
