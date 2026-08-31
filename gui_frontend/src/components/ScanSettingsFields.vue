<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useConfigStore } from '@/stores/config-store'
import { useOutputFormats } from '@/composables/useOutputFormats'

withDefaults(defineProps<{ disabled?: boolean }>(), { disabled: false })

const configStore = useConfigStore()
const { outputFormats, isFormatSelected, toggleFormat } = useOutputFormats()
</script>

<template>
  <!-- General -->
  <div class="grid grid-cols-2 gap-4">
    <Input
      v-model="configStore.config.scan.kingdom_name"
      label="Scan name"
      hint="Prepended to file name"
      :disabled="disabled"
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
          :disabled="disabled"
          class="text-xs"
        >
          {{ fmt.display }}
        </Button>
      </div>
    </div>
  </div>

  <!-- Emulator settings -->
  <div class="grid grid-cols-2 gap-4">
    <Input
      v-if="configStore.config.general.emulator === 'bluestacks'"
      v-model="configStore.config.general.bluestacks.name"
      label="Emulator name"
      hint="BlueStacks instance name"
      :disabled="disabled"
    />
    <Input
      v-model="configStore.config.general.adb_port"
      label="ADB Port"
      hint="Autofilled if found"
      :disabled="disabled"
    />
  </div>

  <!-- Governors to scan -->
  <Input
    type="number"
    v-model.number="configStore.config.scan.people_to_scan"
    label="Governors to scan"
    hint="Amount of people to scan"
    :disabled="disabled"
  />

  <slot />

  <!-- Delays Row -->
  <div class="grid grid-cols-3 gap-2 xl:gap-4">
    <Input
      type="number"
      step="0.1"
      v-model.number="configStore.config.scan.timings.info_close"
      label="Info delay (s)"
      hint="Wait after more info"
      :disabled="disabled"
    />
    <Input
      type="number"
      step="0.1"
      v-model.number="configStore.config.scan.timings.gov_close"
      label="Gov delay (s)"
      hint="Wait after governor"
      :disabled="disabled"
    />
    <Input
      type="number"
      step="0.1"
      v-model.number="configStore.config.scan.timings.max_random"
      label="Random delay (s)"
      hint="Max added variance"
      :disabled="disabled"
    />
  </div>
</template>
