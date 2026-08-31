import { computed } from 'vue'
import { toast } from '@/components/ui/toast'
import * as ipc from '@/lib/tauriClient'
import { useConfigStore } from '@/stores/config-store'
import { useKingdomStore } from '@/stores/kingdom-store'
import { useAllianceStore } from '@/stores/alliance-store'
import { useHonorStore } from '@/stores/honor-store'
import { useSeedStore } from '@/stores/seed-store'

/**
 * Minimal shape required from a scanner store. Properties are accessed
 * through the reactive store proxy, so plain booleans are correct here.
 */
export interface ScanStoreLike {
  scanRunning: boolean
  startButtonDisabled: boolean
}

interface ScanControlOptions {
  /** Pre-start validation; return false to abort (show your own toast) */
  validate?: () => boolean
  start: () => Promise<void>
  stop: () => Promise<void>
}

/** Whether ANY scanner (kingdom or batch) currently has a scan running. */
export function useAnyScanRunning() {
  return computed(
    () =>
      useKingdomStore().scanRunning ||
      useAllianceStore().scanRunning ||
      useHonorStore().scanRunning ||
      useSeedStore().scanRunning,
  )
}

/**
 * Shared scan start/stop control for KingdomScanner and BatchScanner.
 *
 * Owns the optimistic button flags, the start/stop variant, cross-scanner
 * mutual exclusion, and fail-safe IPC: a rejected invoke rolls the flags
 * back and surfaces an error instead of leaving "Stopping…" stuck forever.
 */
export function useScanControl(store: ScanStoreLike, options: ScanControlOptions) {
  const configStore = useConfigStore()
  const anyScanRunning = useAnyScanRunning()

  // Reactive views over the store's state
  const scanRunning = computed(() => store.scanRunning)
  const startButtonDisabled = computed(() => store.startButtonDisabled)

  // Another scanner is using the emulator → block Start, keep Stop usable
  const blockedByOtherScan = computed(() => !scanRunning.value && anyScanRunning.value)

  const startBtnVariant = computed(() => {
    if (startButtonDisabled.value) return 'secondary'
    if (scanRunning.value) return 'destructive'
    return 'default'
  })

  async function attemptStart(): Promise<boolean> {
    if (scanRunning.value || startButtonDisabled.value) return false
    if (anyScanRunning.value) {
      toast({
        title: 'Another Scan Is Running',
        description: 'Stop the active scan before starting a new one.',
        variant: 'destructive',
      })
      return false
    }
    if (options.validate && !options.validate()) return false

    // Auto-save config so scanner-page tweaks aren't lost on crash —
    // fire-and-forget with surfaced failure; must not delay the start.
    ipc.saveConfig(configStore.config).catch((e) => {
      console.warn('Config auto-save failed:', e)
      toast({
        title: 'Config Save Failed',
        description: 'Settings changes could not be saved to disk.',
        variant: 'destructive',
      })
    })

    try {
      await options.start()
      store.scanRunning = true
      return true
    } catch (e) {
      console.error('Failed to start scan:', e)
      toast({
        title: 'Could Not Start Scan',
        description: String(e),
        variant: 'destructive',
      })
      return false
    }
  }

  async function attemptStop(): Promise<void> {
    if (!scanRunning.value) return
    store.startButtonDisabled = true
    try {
      await options.stop()
      // Flags reset when the sidecar confirms via *_scan_finished events.
    } catch (e) {
      console.error('Failed to stop scan:', e)
      toast({
        title: 'Stop Failed',
        description: String(e),
        variant: 'destructive',
      })
      store.startButtonDisabled = false
    }
  }

  return {
    scanRunning,
    startButtonDisabled,
    anyScanRunning,
    blockedByOtherScan,
    startBtnVariant,
    attemptStart,
    attemptStop,
  }
}
