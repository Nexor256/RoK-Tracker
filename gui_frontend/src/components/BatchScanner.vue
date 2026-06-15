<template>
  <div class="grid grid-cols-1 gap-4 lg:grid-cols-12 min-h-0 h-full">
    <!-- Left panel: controls -->
    <div class="flex flex-col gap-4 lg:col-span-8 min-h-0 overflow-y-auto pr-1">
      <div class="grid grid-cols-2 gap-4">
        <Input
          v-model="configStore.config.scan.kingdom_name"
          label="Scan name"
          hint="Prepended to file name"
          :disabled="scanRunning"
        />
        <div class="space-y-1.5 flex flex-col justify-end">
          <label class="text-sm font-medium leading-none">Output formats</label>
          <div class="flex gap-2">
            <Button
              v-for="fmt in outputFormats"
              :key="fmt.value"
              :variant="isFormatSelected(fmt) ? 'default' : 'outline'"
              size="sm"
              @click="toggleFormat(fmt)"
              :disabled="scanRunning"
              class="text-xs"
            >
              {{ fmt.display }}
            </Button>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <Input
          v-if="configStore.config.general.emulator === 'bluestacks'"
          v-model="configStore.config.general.bluestacks.name"
          label="Emulator name"
          hint="BlueStacks instance name"
          :disabled="scanRunning"
        />
        <Input
          v-model="configStore.config.general.adb_port"
          label="ADB Port"
          hint="Autofilled if found"
          :disabled="scanRunning"
        />
      </div>

      <Input
        v-model="configStore.config.scan.people_to_scan"
        label="Governors to scan"
        hint="Amount of people to scan"
        :disabled="scanRunning"
      />

      <!-- Delays Row -->
      <div class="grid grid-cols-3 gap-2 xl:gap-4">
        <Input
          v-model="configStore.config.scan.timings.info_close"
          label="Info delay (s)"
          hint="Wait after more info"
          :disabled="scanRunning"
        />
        <Input
          v-model="configStore.config.scan.timings.gov_close"
          label="Gov delay (s)"
          hint="Wait after governor"
          :disabled="scanRunning"
        />
        <Input
          v-model="configStore.config.scan.timings.max_random"
          label="Random delay (s)"
          hint="Max added variance"
          :disabled="scanRunning"
        />
      </div>

      <Button
        :variant="scanRunning ? 'destructive' : 'default'"
        @click="handleMainButtonClick"
        :disabled="startButtonDisabled"
      >
        {{ startButtonDisabled ? 'Stopping...' : scanRunning ? 'Stop Scan' : 'Start Scan' }}
      </Button>
    </div>

    <!-- Right panel: batch data + status -->
    <div class="flex flex-col gap-4 lg:col-span-4 min-h-0">
      <LastBatch :batchData="store.lastGovernor" :batchStatus="store.status" />
      <ScanStatus :scan-id="store.scanID" :status-message="store.statusMessage" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import ScanStatus from './ScanStatus.vue'
import LastBatch from './LastBatch.vue'
import { useAllianceStore } from '@/stores/alliance-store'
import { useHonorStore } from '@/stores/honor-store'
import { useSeedStore } from '@/stores/seed-store'
import { useConfigStore } from '@/stores/config-store'
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
const { scanRunning, startButtonDisabled } = storeToRefs(store)

import { useOutputFormats } from '@/composables/useOutputFormats'
const { outputFormats, isFormatSelected, toggleFormat } = useOutputFormats()

const handleMainButtonClick = () => {
  if (!scanRunning.value) {
    // Auto-save config so scanner-page tweaks aren't lost on crash
    ipc.saveConfig(configStore.config).catch(() => {})
    ipc.startBatchScan(configStore.config, props.batchType)
    scanRunning.value = true
  } else {
    ipc.stopBatchScan(props.batchType)
    startButtonDisabled.value = true
  }
}
</script>
