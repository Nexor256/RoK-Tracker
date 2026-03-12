<template>
  <div class="flex gap-4">
    <!-- Left panel: controls -->
    <div class="flex w-2/3 gap-4">
      <!-- Preset + tree + actions -->
      <div class="flex w-1/3 flex-col gap-3">
        <!-- Scan Preset Select -->
        <div class="space-y-1">
          <label class="text-sm font-medium">Scan Preset</label>
          <div class="flex items-center gap-2">
            <Select v-model="selectedPresetName" :disabled="scanRunning">
              <SelectTrigger class="flex-1">
                <SelectValue :placeholder="selectedPreset?.name ?? 'Select preset'" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="preset in configStore.availableScanPresets"
                  :key="preset.name"
                  :value="preset.name"
                >
                  {{ preset.name }}
                </SelectItem>
              </SelectContent>
            </Select>
            <Button
              v-if="selectedPreset"
              variant="destructive"
              size="icon"
              @click="handleDeletePreset"
              :disabled="scanRunning"
            >
              <Trash2 class="h-4 w-4" />
            </Button>
          </div>
        </div>

        <!-- Info Tree (checkboxes) -->
        <div class="space-y-1 rounded-md border p-2">
          <div v-for="group in infoToScan" :key="group.label" class="space-y-1">
            <div class="flex items-center gap-2">
              <Checkbox
                :checked="isGroupChecked(group)"
                @update:checked="toggleGroup(group, $event)"
                :disabled="scanRunning"
              />
              <span class="text-sm font-medium">{{ group.label }}</span>
            </div>
            <div v-if="group.children" class="ml-4 space-y-1">
              <div v-for="subGroup in group.children" :key="subGroup.label" class="space-y-0.5">
                <div class="flex items-center gap-2">
                  <Checkbox
                    :checked="isGroupChecked(subGroup)"
                    @update:checked="toggleGroup(subGroup, $event)"
                    :disabled="scanRunning"
                  />
                  <span class="text-xs font-medium text-muted-foreground">{{ subGroup.label }}</span>
                </div>
                <div v-if="subGroup.children" class="ml-4 space-y-0.5">
                  <div v-for="leaf in subGroup.children" :key="leaf.label" class="flex items-center gap-2">
                    <Checkbox
                      :checked="configStore.selectedKingdomOptions.selections.includes(leaf.label as SelectionValue)"
                      @update:checked="toggleLeaf(leaf.label as SelectionValue, $event)"
                      :disabled="scanRunning"
                    />
                    <span class="text-xs">{{ leaf.label }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Button variant="secondary" @click="handleSavePreset" :disabled="scanRunning">
          Save as Preset
        </Button>

        <Button
          :variant="scanRunning ? 'destructive' : 'default'"
          @click="handleMainButtonClick"
          :disabled="startButtonDisabled"
        >
          {{ startButtonDisabled ? 'Stopping...' : scanRunning ? 'Stop Scan' : 'Start Scan' }}
        </Button>
      </div>

      <!-- Form fields -->
      <div class="flex flex-1 flex-col gap-3">
        <div class="flex gap-3">
          <Input
            class="flex-1"
            v-model="configStore.config.scan.kingdom_name"
            label="Scan name"
            hint="This will get prepended to the file name"
            :disabled="scanRunning"
          />
          <!-- Output formats multi-select using badges -->
          <div class="flex-1 space-y-1">
            <label class="text-sm font-medium">Output formats</label>
            <div class="flex flex-wrap gap-1 rounded-md border p-2 min-h-[36px]">
              <Badge
                v-for="(fmt, idx) in selectedOutputs"
                :key="fmt.value"
                variant="outline"
                class="flex items-center gap-1 cursor-pointer"
                @click="removeOutput(idx)"
              >
                {{ fmt.display }}
                <X class="h-3 w-3" />
              </Badge>
            </div>
            <div class="flex gap-1 mt-1">
              <Button
                v-for="fmt in availableOutputFormats"
                :key="fmt.value"
                variant="ghost"
                size="sm"
                @click="addOutput(fmt)"
                :disabled="scanRunning"
                class="text-xs h-6"
              >
                + {{ fmt.display }}
              </Button>
            </div>
            <p class="text-xs text-muted-foreground">The format you want</p>
          </div>
        </div>

        <div class="flex gap-3">
          <Input
            class="flex-1"
            v-model="configStore.config.general.bluestacks.name"
            label="Emulator name"
            hint="Works only for BlueStacks"
            :disabled="scanRunning"
          />
          <Input
            class="flex-1"
            v-model="configStore.config.general.adb_port"
            label="ADB Port of emulator"
            hint="Should be autofilled if emulator is found"
            :disabled="scanRunning"
          />
        </div>

        <Input
          v-model="configStore.config.scan.people_to_scan"
          label="How many people to scan"
          hint="The amount of people you want to scan"
          :disabled="scanRunning"
        />

        <Switch
          :checked="configStore.config.scan.resume"
          @update:checked="configStore.config.scan.resume = $event"
          label="Start at 4th governor"
          :disabled="scanRunning"
        />
        <Switch
          :checked="configStore.config.scan.advanced_scroll"
          @update:checked="configStore.config.scan.advanced_scroll = $event"
          label="Better Scrolling"
          :disabled="scanRunning"
        />
        <Switch
          :checked="configStore.config.scan.track_inactives"
          @update:checked="configStore.config.scan.track_inactives = $event"
          label="Track inactives"
          :disabled="scanRunning"
        />
        <Switch
          :checked="configStore.config.scan.validate_kills"
          @update:checked="configStore.config.scan.validate_kills = $event"
          label="Validate kills"
          :disabled="scanRunning"
        />
        <Switch
          :checked="configStore.config.scan.reconstruct_kills"
          @update:checked="configStore.config.scan.reconstruct_kills = $event"
          label="Reconstruct kills"
          :disabled="scanRunning || !configStore.config.scan.validate_kills"
        />

        <div class="flex items-center gap-3">
          <Switch
            :checked="configStore.config.scan.validate_power"
            @update:checked="configStore.config.scan.validate_power = $event"
            label="Validate Power"
            :disabled="scanRunning"
          />
          <Input
            class="flex-1"
            v-model="configStore.config.scan.power_threshold"
            label="Power tolerance"
            hint="Acceptable power in wrong direction"
            :disabled="scanRunning || !configStore.config.scan.validate_power"
          />
        </div>

        <div class="flex gap-3">
          <Input
            class="flex-1"
            v-model="configStore.config.scan.timings.info_close"
            label="Wait after more close (in s)"
            hint="Delay after exiting more info"
            :disabled="scanRunning"
          />
          <Input
            class="flex-1"
            v-model="configStore.config.scan.timings.gov_close"
            label="Wait after governor close (in s)"
            hint="Delay after exiting governor"
            :disabled="scanRunning"
          />
        </div>

        <Input
          v-model="configStore.config.scan.timings.max_random"
          label="Maximum random delay (in s)"
          hint="A random delay is added to the wait times, this is the maximum"
          :disabled="scanRunning"
        />
      </div>
    </div>

    <!-- Right panel: governor data + status -->
    <div class="flex flex-1 flex-col gap-3">
      <div class="flex-1">
        <LastGovernor />
      </div>
      <ScanStatus :scan-id="kingdomStore.scanID" :status-message="kingdomStore.statusMessage" />
    </div>

    <!-- Save Preset Dialog -->
    <AlertDialog :open="saveDialogOpen">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Save Preset</AlertDialogTitle>
          <AlertDialogDescription>Enter a name for the preset</AlertDialogDescription>
        </AlertDialogHeader>
        <Input v-model="newPresetName" placeholder="Preset name" />
        <AlertDialogFooter>
          <AlertDialogCancel @click="saveDialogOpen = false">Cancel</AlertDialogCancel>
          <AlertDialogAction @click="confirmSavePreset" :disabled="!newPresetName">Save</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <!-- Delete Preset Dialog -->
    <AlertDialog :open="deleteDialogOpen">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Preset</AlertDialogTitle>
          <AlertDialogDescription>
            Do you really want to delete the {{ selectedPreset?.name }} preset?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel @click="deleteDialogOpen = false">No</AlertDialogCancel>
          <AlertDialogAction @click="confirmDeletePreset">Yes</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <!-- Confirm scan dialog -->
    <AlertDialog :open="confirmDialogOpen">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm</AlertDialogTitle>
          <AlertDialogDescription>Do you want to continue?</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel @click="handleConfirmResponse(false)">No</AlertDialogCancel>
          <AlertDialogAction @click="handleConfirmResponse(true)">Yes</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Trash2, X } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import LastGovernor from './LastGovernor.vue'
import ScanStatus from './ScanStatus.vue'
import { useKingdomStore } from '@/stores/kingdom-store'
import { useConfigStore } from '@/stores/config-store'
import { KingdomGovernorDataSchema } from '@/schema/KingdomGovernorData'
import { KingdomAdditionalDataSchema } from '@/schema/KingdomAdditionalData'
import type { ScanPreset } from '@/schema/ScanPreset'
import type { OutputFormat } from '@/types/OutputFormats'

const kingdomStore = useKingdomStore()
const configStore = useConfigStore()

const scanRunning = ref(false)
const startButtonDisabled = ref(false)

// ---- Preset management ----
const selectedPresetName = ref(configStore.availableScanPresets[0]?.name ?? '')
const selectedPreset = computed(() =>
  configStore.availableScanPresets.find(p => p.name === selectedPresetName.value)
)

watch(selectedPresetName, () => {
  if (selectedPreset.value) {
    configStore.selectedKingdomOptions.selections = selectedPreset.value.selections
  }
})

// Save preset dialog
const saveDialogOpen = ref(false)
const newPresetName = ref('')

const handleSavePreset = () => {
  newPresetName.value = ''
  saveDialogOpen.value = true
}

const confirmSavePreset = () => {
  const newPreset: ScanPreset = {
    name: newPresetName.value,
    selections: configStore.selectedKingdomOptions.selections,
  }
  configStore.availableScanPresets.push(newPreset)
  selectedPresetName.value = newPreset.name
  window.pywebview.api.SaveScanPresets(JSON.stringify(configStore.availableScanPresets))
  saveDialogOpen.value = false
}

// Delete preset dialog
const deleteDialogOpen = ref(false)

const handleDeletePreset = () => {
  deleteDialogOpen.value = true
}

const confirmDeletePreset = () => {
  configStore.availableScanPresets = configStore.availableScanPresets.filter(
    (p) => p.name !== selectedPreset.value?.name,
  )
  selectedPresetName.value = ''
  window.pywebview.api.SaveScanPresets(JSON.stringify(configStore.availableScanPresets))
  deleteDialogOpen.value = false
}

// ---- Output formats ----
const outputFormats: OutputFormat[] = [
  { label: 'Excel (xlsx)', value: 'xlsx', display: 'xlsx' },
  { label: 'Comma Separated Values (csv)', value: 'csv', display: 'csv' },
  { label: 'JSON Lines (jsonl)', value: 'jsonl', display: 'jsonl' },
]

const selectedOutputs = ref<OutputFormat[]>([
  { label: 'Excel', value: 'xlsx', display: 'xlsx' },
])

const availableOutputFormats = computed(() =>
  outputFormats.filter(f => !selectedOutputs.value.some(s => s.value === f.value))
)

const addOutput = (fmt: OutputFormat) => {
  selectedOutputs.value.push(fmt)
}

const removeOutput = (index: number) => {
  selectedOutputs.value.splice(index, 1)
}

watch(selectedOutputs, (newVal) => {
  configStore.config.scan.formats.csv = newVal.some((f) => f.value === 'csv')
  configStore.config.scan.formats.jsonl = newVal.some((f) => f.value === 'jsonl')
  configStore.config.scan.formats.xlsx = newVal.some((f) => f.value === 'xlsx')
}, { deep: true })

// ---- Tree (info to scan) ----
interface TreeNode {
  label: string
  children?: TreeNode[]
}

const infoToScan: TreeNode[] = [
  {
    label: 'Everything',
    children: [
      {
        label: 'First Screen',
        children: [
          { label: 'ID' }, { label: 'Name' }, { label: 'Power' },
          { label: 'Killpoints' }, { label: 'Alliance' },
        ],
      },
      {
        label: 'Second Screen',
        children: [
          { label: 'T1 Kills' }, { label: 'T2 Kills' }, { label: 'T3 Kills' },
          { label: 'T4 Kills' }, { label: 'T5 Kills' }, { label: 'Ranged' },
        ],
      },
      {
        label: 'Third Screen',
        children: [
          { label: 'Deaths' }, { label: 'Assistance' },
          { label: 'Gathered' }, { label: 'Helps' },
        ],
      },
    ],
  },
]

type SelectionValue = ScanPreset['selections'][number]

const getLeaves = (node: TreeNode): SelectionValue[] => {
  if (!node.children) return [node.label as SelectionValue]
  return node.children.flatMap(getLeaves)
}

const isGroupChecked = (node: TreeNode): boolean => {
  const leaves = getLeaves(node)
  return leaves.every(l => configStore.selectedKingdomOptions.selections.includes(l))
}

const toggleGroup = (node: TreeNode, checked: boolean) => {
  const leaves = getLeaves(node)
  if (checked) {
    const toAdd = leaves.filter(l => !configStore.selectedKingdomOptions.selections.includes(l))
    configStore.selectedKingdomOptions.selections.push(...toAdd)
  } else {
    configStore.selectedKingdomOptions.selections = configStore.selectedKingdomOptions.selections.filter(
      s => !(leaves as string[]).includes(s)
    )
  }
}

const toggleLeaf = (label: SelectionValue, checked: boolean) => {
  if (checked) {
    if (!configStore.selectedKingdomOptions.selections.includes(label)) {
      configStore.selectedKingdomOptions.selections.push(label)
    }
  } else {
    configStore.selectedKingdomOptions.selections = configStore.selectedKingdomOptions.selections.filter(
      s => s !== label
    )
  }
}

// ---- Scan control ----
const handleMainButtonClick = () => {
  if (!scanRunning.value) {
    window.pywebview.api.StartKingdomScan(
      JSON.stringify(configStore.config),
      JSON.stringify(selectedPreset.value),
    )
    scanRunning.value = true
  } else {
    window.pywebview.api.StopKingdomScan()
    startButtonDisabled.value = true
  }
}

// ---- IPC callbacks (same logic as before) ----
const confirmDialogOpen = ref(false)

const handleConfirmResponse = (confirmed: boolean) => {
  confirmDialogOpen.value = false
  window.pywebview.api.ConfirmCallback(confirmed)
}

const setScanId = (id: string) => {
  kingdomStore.scanID = id
}

const governorUpdate = (governorData: string, extraData: string) => {
  kingdomStore.lastGovernor = KingdomGovernorDataSchema.parse(JSON.parse(governorData))
  kingdomStore.status = KingdomAdditionalDataSchema.parse(JSON.parse(extraData))
}

const stateUpdate = (state: string) => {
  kingdomStore.statusMessage = state
}

const askConfirm = (_message: string) => {
  confirmDialogOpen.value = true
}

const scanFinished = () => {
  scanRunning.value = false
  startButtonDisabled.value = false
}

window.kingdom = {
  setScanID: setScanId,
  governorUpdate: governorUpdate,
  stateUpdate: stateUpdate,
  askConfirm: askConfirm,
  scanFinished: scanFinished,
}
</script>
