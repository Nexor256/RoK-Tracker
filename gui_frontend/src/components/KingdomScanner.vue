<template>
  <div class="grid grid-cols-1 gap-4 lg:grid-cols-[200px_11fr_8fr] min-h-0 h-full">
    <!-- Left Column: Controls (Presets & Tree) -->
    <Card class="flex flex-col gap-4 p-4 min-h-0 overflow-y-auto">
      <!-- Scan Preset -->
      <div class="space-y-1.5">
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

      <Separator />

      <!-- Info Tree Header -->
      <div class="flex items-center justify-between mb-2 mt-1 pr-2">
        <span class="text-sm font-medium text-muted-foreground">Fields to scan</span>
        <div class="flex gap-1">
          <Button variant="ghost" size="icon" class="h-6 w-6" @click="expandAll" title="Expand All">
            <UnfoldVertical class="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            class="h-6 w-6"
            @click="collapseAll"
            title="Collapse All"
          >
            <FoldVertical class="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        </div>
      </div>

      <!-- Info Tree (checkboxes) -->
      <div class="flex-1 overflow-y-auto pr-2">
        <div v-for="group in infoToScan" :key="group.label" class="space-y-1.5">
          <div class="flex items-center gap-2 w-full">
            <Checkbox
              :checked="isGroupChecked(group)"
              @update:checked="toggleGroup(group, $event)"
              :disabled="scanRunning"
            />
            <span class="text-sm font-medium truncate">{{ group.label }}</span>
          </div>
          <div v-if="group.children" class="ml-4 space-y-1.5">
            <div v-for="subGroup in group.children" :key="subGroup.label" class="space-y-1 w-full">
              <div class="flex items-center gap-2 w-full">
                <Checkbox
                  :checked="isGroupChecked(subGroup)"
                  @update:checked="toggleGroup(subGroup, $event)"
                  :disabled="scanRunning"
                />
                <div
                  class="flex-1 min-w-0 flex items-center justify-between cursor-pointer select-none group/section"
                  @click="toggleSection(subGroup.label)"
                >
                  <span
                    class="text-xs font-medium text-muted-foreground group-hover/section:text-foreground transition-colors truncate mr-1"
                  >
                    {{ subGroup.label }} ({{ subGroup.children?.length ?? 0 }})
                  </span>
                  <component
                    :is="collapsedSections[subGroup.label] ? ChevronRight : ChevronDown"
                    class="h-3.5 w-3.5 shrink-0 text-muted-foreground group-hover/section:text-foreground transition-colors"
                  />
                </div>
              </div>
              <div
                v-show="!collapsedSections[subGroup.label]"
                v-if="subGroup.children"
                class="ml-4 space-y-1"
              >
                <div
                  v-for="leaf in subGroup.children"
                  :key="leaf.label"
                  class="flex items-center gap-2"
                >
                  <Checkbox
                    :checked="
                      configStore.selectedKingdomOptions.selections.includes(
                        leaf.label as SelectionValue,
                      )
                    "
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

      <!-- Action buttons -->
      <div class="mt-auto flex flex-col gap-2">
        <Button variant="secondary" size="sm" @click="handleSavePreset" :disabled="scanRunning">
          Save as Preset
        </Button>

        <Button
          size="sm"
          :variant="startBtnVariant"
          @click="handleMainButtonClick"
          :disabled="startButtonDisabled || blockedByOtherScan"
          :title="blockedByOtherScan ? 'Another scan is running' : undefined"
        >
          {{ startButtonDisabled ? 'Stopping...' : scanRunning ? 'Stop Scan' : 'Start Scan' }}
        </Button>
      </div>
    </Card>

    <!-- Middle Column: Form Settings -->
    <div class="flex flex-col gap-6 min-h-0 overflow-y-auto pr-1">
      <div class="flex flex-col gap-6">
        <ScanSettingsFields :disabled="scanRunning">
          <!-- Toggles grid -->
          <div
            class="grid grid-cols-2 gap-x-4 gap-y-3 rounded-md bg-muted/50 dark:bg-muted/10 backdrop-blur-md p-3 border border-border/60 dark:border-border/50 shadow-sm"
          >
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
          </div>

          <!-- Power Validation Row -->
          <div class="flex items-center gap-4 mt-1">
            <div class="w-1/3">
              <Switch
                :checked="configStore.config.scan.validate_power"
                @update:checked="configStore.config.scan.validate_power = $event"
                label="Validate Power"
                :disabled="scanRunning"
              />
            </div>
            <div class="w-2/3">
              <Input
                type="number"
                v-model.number="configStore.config.scan.power_threshold"
                label="Power tolerance"
                hint="Tolerance threshold"
                :disabled="scanRunning || !configStore.config.scan.validate_power"
              />
            </div>
          </div>

          <!-- City Hall Verification -->
          <div
            class="p-3 border border-border/60 dark:border-border/50 rounded-md bg-muted/50 dark:bg-muted/10 backdrop-blur-md mt-1 shadow-sm transition-all duration-200"
            :class="{ 'opacity-60': !configStore.config.scan.check_cityhall }"
          >
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium">City Hall Verification</span>
              <Switch
                :checked="configStore.config.scan.check_cityhall"
                @update:checked="configStore.config.scan.check_cityhall = $event"
                :disabled="scanRunning"
              />
            </div>
            <transition
              enter-active-class="transition-all duration-200 ease-out"
              leave-active-class="transition-all duration-150 ease-in"
              enter-from-class="opacity-0 max-h-0"
              enter-to-class="opacity-100 max-h-24"
              leave-from-class="opacity-100 max-h-24"
              leave-to-class="opacity-0 max-h-0"
            >
              <div v-if="configStore.config.scan.check_cityhall" class="mt-3 overflow-hidden">
                <Input
                  v-model.number="configStore.config.scan.ch_auto_assign_power"
                  type="number"
                  label="Auto-Assign Power Threshold"
                  hint="CH level auto-assigned above this power"
                  :disabled="scanRunning"
                />
              </div>
            </transition>
          </div>
        </ScanSettingsFields>
      </div>
    </div>

    <!-- Right Column: Results & Status -->
    <div class="flex flex-col min-h-0 lg:-mt-14">
      <div class="flex-1 flex flex-col gap-2 min-h-0">
        <LastGovernor class="flex-1 min-h-0" />
        <ScanStatus
          class="mt-auto shrink-0"
          :scan-id="kingdomStore.scanID"
          :status-message="kingdomStore.statusMessage"
        />
      </div>
    </div>

    <!-- Dialogs -->
    <AlertDialog v-model:open="saveDialogOpen">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Save Preset</AlertDialogTitle>
          <AlertDialogDescription>Enter a name for the preset</AlertDialogDescription>
        </AlertDialogHeader>
        <Input v-model="newPresetName" placeholder="Preset name" />
        <AlertDialogFooter>
          <AlertDialogCancel @click="saveDialogOpen = false">Cancel</AlertDialogCancel>
          <AlertDialogAction @click="confirmSavePreset" :disabled="!newPresetName"
            >Save</AlertDialogAction
          >
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <AlertDialog v-model:open="deleteDialogOpen">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Preset</AlertDialogTitle>
          <AlertDialogDescription>
            Do you really want to delete the {{ selectedPreset?.name }} preset?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel @click="deleteDialogOpen = false">No</AlertDialogCancel>
          <AlertDialogAction
            @click="confirmDeletePreset"
            class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >Yes, delete</AlertDialogAction
          >
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <ConfirmDialog
      :open="confirmDialogOpen"
      title="Continue Scan?"
      :message="confirmMessage || 'Do you want to continue?'"
      confirm-text="Yes"
      cancel-text="No"
      @confirm="handleConfirmResponse(true)"
      @update:open="onConfirmOpenChange"
    />

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
import { computed, ref, watch, onMounted, onUnmounted } from 'vue'
import { Trash2, ChevronDown, ChevronRight, FoldVertical, UnfoldVertical } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import LastGovernor from './LastGovernor.vue'
import ScanStatus from './ScanStatus.vue'
import ScanSettingsFields from './ScanSettingsFields.vue'
import ConfirmDialog from './ConfirmDialog.vue'
import { useKingdomStore } from '@/stores/kingdom-store'
import { useConfigStore } from '@/stores/config-store'
import { toast } from '@/components/ui/toast'
import { KingdomGovernorDataSchema } from '@/schema/KingdomGovernorData'
import { KingdomAdditionalDataSchema } from '@/schema/KingdomAdditionalData'
import type { ScanPreset } from '@/schema/ScanPreset'

import * as ipc from '@/lib/tauriClient'
import { onSidecarEvent } from '@/lib/tauriClient'
import { useScanControl } from '@/composables/useScanControl'

const kingdomStore = useKingdomStore()
const configStore = useConfigStore()

// ---- Preset management ----
const selectedPresetName = ref(configStore.availableScanPresets[0]?.name ?? '')
const selectedPreset = computed(() =>
  configStore.availableScanPresets.find((p) => p.name === selectedPresetName.value),
)

watch(selectedPresetName, () => {
  if (selectedPreset.value) {
    // Copy — assigning by reference would make checkbox toggles mutate the
    // stored preset itself, and auto-save would persist that corruption.
    configStore.selectedKingdomOptions.selections = [...selectedPreset.value.selections]
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
  const name = newPresetName.value.trim()
  if (!name) return
  if (configStore.availableScanPresets.some((p) => p.name === name)) {
    toast({
      title: 'Preset Already Exists',
      description: `A preset named "${name}" already exists. Pick another name.`,
      variant: 'destructive',
    })
    return
  }
  const newPreset: ScanPreset = {
    name,
    // Copy — sharing the live selections array would alias the preset to
    // future checkbox changes.
    selections: [...configStore.selectedKingdomOptions.selections],
  }
  configStore.availableScanPresets.push(newPreset)
  selectedPresetName.value = newPreset.name
  ipc.saveScanPresets(configStore.availableScanPresets).catch((e) => {
    toast({
      title: 'Preset Save Failed',
      description: String(e),
      variant: 'destructive',
    })
  })
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
  ipc.saveScanPresets(configStore.availableScanPresets).catch((e) => {
    toast({
      title: 'Preset Save Failed',
      description: String(e),
      variant: 'destructive',
    })
  })
  deleteDialogOpen.value = false
}

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
          { label: 'ID' },
          { label: 'Name' },
          { label: 'Power' },
          { label: 'Killpoints' },
          { label: 'Acclaim' },
          { label: 'Highest Acclaim' },
          { label: 'Alliance' },
        ],
      },
      {
        label: 'Second Screen',
        children: [
          { label: 'T1 Kills' },
          { label: 'T2 Kills' },
          { label: 'T3 Kills' },
          { label: 'T4 Kills' },
          { label: 'T5 Kills' },
          { label: 'Ranged' },
        ],
      },
      {
        label: 'Third Screen',
        children: [
          { label: 'Deaths' },
          { label: 'Assistance' },
          { label: 'Gathered' },
          { label: 'Helps' },
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
  return leaves.every((l) => configStore.selectedKingdomOptions.selections.includes(l))
}

const toggleGroup = (node: TreeNode, checked: boolean) => {
  const leaves = getLeaves(node)
  if (checked) {
    const toAdd = leaves.filter((l) => !configStore.selectedKingdomOptions.selections.includes(l))
    configStore.selectedKingdomOptions.selections.push(...toAdd)
  } else {
    configStore.selectedKingdomOptions.selections =
      configStore.selectedKingdomOptions.selections.filter((s) => !(leaves as string[]).includes(s))
  }
}

const toggleLeaf = (label: SelectionValue, checked: boolean) => {
  if (checked) {
    if (!configStore.selectedKingdomOptions.selections.includes(label)) {
      configStore.selectedKingdomOptions.selections.push(label)
    }
  } else {
    configStore.selectedKingdomOptions.selections =
      configStore.selectedKingdomOptions.selections.filter((s) => s !== label)
  }
}

const collapsedSections = ref<Record<string, boolean>>({})

const toggleSection = (label: string) => {
  collapsedSections.value[label] = !collapsedSections.value[label]
}

const expandAll = () => {
  collapsedSections.value = {}
}

const collapseAll = () => {
  const newCollapsed: Record<string, boolean> = {}
  infoToScan.forEach((group) => {
    group.children?.forEach((subGroup) => {
      newCollapsed[subGroup.label] = true
    })
  })
  collapsedSections.value = newCollapsed
}

// ---- Scan control ----
const { scanRunning, startButtonDisabled, blockedByOtherScan, startBtnVariant, attemptStart, attemptStop } =
  useScanControl(kingdomStore, {
    validate: () => {
      if (configStore.config.scan.people_to_scan <= 0) {
        toast({
          title: 'Invalid Input',
          description: 'Governors to scan must be > 0',
          variant: 'destructive',
        })
        return false
      }
      if (configStore.selectedKingdomOptions.selections.length === 0) {
        toast({
          title: 'No Fields Selected',
          description: 'Select at least one field to scan',
          variant: 'destructive',
        })
        return false
      }
      return true
    },
    start: async () => {
      // Use the selected preset, or build one from current checkbox selections
      const preset: ScanPreset = {
        name: selectedPreset.value?.name ?? 'Custom',
        selections: [...configStore.selectedKingdomOptions.selections],
      }
      await ipc.startKingdomScan(configStore.config, preset)
    },
    stop: () => ipc.stopKingdomScan(),
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

// ---- IPC callbacks ----
const confirmDialogOpen = ref(false)
const confirmMessage = ref('')
let awaitingConfirm = false

const handleConfirmResponse = (confirmed: boolean) => {
  if (!awaitingConfirm) return
  awaitingConfirm = false
  confirmDialogOpen.value = false
  ipc.confirmKingdomScan(confirmed)
}

const onConfirmOpenChange = (open: boolean) => {
  if (open) {
    confirmDialogOpen.value = true
    return
  }
  // Escape / dismiss — treat as No if still awaiting
  handleConfirmResponse(false)
}

const setScanId = (id: string) => {
  kingdomStore.scanID = id
}

// Throttle governor updates to one per animation frame to prevent UI jitter during fast scans
let pendingGovUpdate: { gov: unknown; extra: unknown } | null = null
let govRafId: number | null = null

const flushGovUpdate = () => {
  govRafId = null
  if (!pendingGovUpdate) return
  const { gov, extra } = pendingGovUpdate
  pendingGovUpdate = null
  const govResult = KingdomGovernorDataSchema.safeParse(gov)
  if (govResult.success) kingdomStore.lastGovernor = govResult.data

  const extraResult = KingdomAdditionalDataSchema.safeParse(extra)
  if (extraResult.success) kingdomStore.status = extraResult.data
}

const governorUpdate = (governorData: unknown, extraData: unknown) => {
  pendingGovUpdate = { gov: governorData, extra: extraData }
  if (govRafId === null) {
    govRafId = requestAnimationFrame(flushGovUpdate)
  }
}

const stateUpdate = (state: string) => {
  kingdomStore.statusMessage = state
}

const askConfirm = (message: string) => {
  awaitingConfirm = true
  confirmMessage.value = message
  confirmDialogOpen.value = true
}

const scanFinished = () => {
  kingdomStore.scanRunning = false
  kingdomStore.startButtonDisabled = false
}

// ---- Sidecar event listeners ----
const unlisteners: Array<() => void> = []

onMounted(async () => {
  unlisteners.push(
    await onSidecarEvent('kingdom_scan_id', (data) => {
      setScanId(data)
    }),
  )
  unlisteners.push(
    await onSidecarEvent('kingdom_governor_update', (data) => {
      governorUpdate(data.gov, data.extra)
    }),
  )
  unlisteners.push(
    await onSidecarEvent('kingdom_state_update', (data) => {
      stateUpdate(data)
    }),
  )
  unlisteners.push(
    await onSidecarEvent('kingdom_ask_confirm', (data) => {
      askConfirm(data)
    }),
  )
  unlisteners.push(
    await onSidecarEvent('kingdom_scan_finished', () => {
      scanFinished()
    }),
  )
})

onUnmounted(() => {
  unlisteners.forEach((fn) => fn())
  if (govRafId !== null) cancelAnimationFrame(govRafId)
})
</script>
