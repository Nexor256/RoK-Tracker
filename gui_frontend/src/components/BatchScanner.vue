<template>
  <div class="grid grid-cols-1 gap-4 lg:grid-cols-12 min-h-0 h-full">
    <!-- Left panel: controls -->
    <div class="flex flex-col gap-4 lg:col-span-8 min-h-0 overflow-y-auto pr-1">
      <div class="flex flex-col gap-6">
        <ScanSettingsFields :disabled="scanRunning" />

        <!-- Start/Stop button -->
        <Button
          :variant="startBtnVariant"
          @click="handleMainButtonClick"
          :disabled="startButtonDisabled || blockedByOtherScan"
          class="w-full"
          :title="blockedByOtherScan ? 'Another scan is running' : undefined"
        >
          {{ startButtonDisabled ? 'Stopping...' : scanRunning ? 'Stop Scan' : 'Start Scan' }}
        </Button>
      </div>
    </div>

    <!-- Right panel: batch data + status -->
    <div class="flex flex-col gap-4 lg:col-span-4 min-h-0">
      <LastBatch :batchData="store.lastGovernor" :batchStatus="store.status" />
      <ScanStatus :scan-id="store.scanID" :status-message="store.statusMessage" />
    </div>

    <ConfirmDialog
      v-model:open="stopConfirmOpen"
      title="Stop Scan"
      message="Stop the current scan? Governors scanned since the last checkpoint will not be saved."
      confirm-text="Stop Scan"
      cancel-text="Keep Scanning"
      destructive
      @confirm="confirmStop"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Button } from '@/components/ui/button'
import ConfirmDialog from './ConfirmDialog.vue'
import ScanSettingsFields from './ScanSettingsFields.vue'
import ScanStatus from './ScanStatus.vue'
import LastBatch from './LastBatch.vue'
import { useAllianceStore } from '@/stores/alliance-store'
import { useHonorStore } from '@/stores/honor-store'
import { useSeedStore } from '@/stores/seed-store'
import { useConfigStore } from '@/stores/config-store'
import { useScanControl } from '@/composables/useScanControl'
import * as ipc from '@/lib/tauriClient'
import type { BatchType } from '@/schema/BatchType'

const props = defineProps<{
  batchType: BatchType['type']
}>()

// Resolve the correct store based on batch type
const storeMap = {
  Alliance: useAllianceStore,
  Honor: useHonorStore,
  Seed: useSeedStore,
} as const

const store = storeMap[props.batchType]()
const configStore = useConfigStore()

const { scanRunning, startButtonDisabled, blockedByOtherScan, startBtnVariant, attemptStart, attemptStop } =
  useScanControl(store, {
    start: () => ipc.startBatchScan(configStore.config, props.batchType),
    stop: () => ipc.stopBatchScan(props.batchType),
  })

const stopConfirmOpen = ref(false)

const handleMainButtonClick = () => {
  if (!scanRunning.value) {
    void attemptStart()
  } else {
    stopConfirmOpen.value = true
  }
}

const confirmStop = () => {
  stopConfirmOpen.value = false
  void attemptStop()
}
</script>
