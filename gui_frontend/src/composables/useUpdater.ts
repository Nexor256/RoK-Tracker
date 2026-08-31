import { ref } from 'vue'
import { check } from '@tauri-apps/plugin-updater'
import { relaunch } from '@tauri-apps/plugin-process'
import { shutdownForUpdate } from '@/lib/tauriClient'

const AUTO_CHECK_INTERVAL_MS = 4 * 60 * 60 * 1000 // 4 hours
const DISMISS_RETRY_MS = 60 * 60 * 1000 // 1 hour

export type UpdateCheckResult = 'available' | 'up-to-date' | 'network-error' | 'busy'

// Singleton state — shared by every consumer of useUpdater()
const updateAvailable = ref(false)
const updateVersion = ref('')
const updateNotes = ref('')
const downloading = ref(false)
const checking = ref(false)
const downloadProgress = ref(0)
const downloadTotal = ref(0)
const dismissed = ref(false)
const errorMessage = ref('')
const errorDismissed = ref(false)

let pendingUpdate: Awaited<ReturnType<typeof check>> | null = null
let autoCheckTimer: ReturnType<typeof setInterval> | null = null
let dismissRetryTimer: ReturnType<typeof setTimeout> | null = null

/**
 * Check for updates.
 *
 * Automatic (background) checks fail silently — offline users should not be
 * nagged on every launch. Only manual checks surface errors in the UI.
 */
async function checkForUpdates(manual = false): Promise<UpdateCheckResult> {
  if (checking.value || downloading.value) return 'busy'
  checking.value = true

  try {
    const update = await check()
    if (update) {
      pendingUpdate = update
      updateVersion.value = update.version
      updateNotes.value = update.body ?? ''
      updateAvailable.value = true
      dismissed.value = false
      errorMessage.value = ''
      return 'available'
    }
    return 'up-to-date'
  } catch (e) {
    console.warn('Update check failed:', e)
    if (manual) {
      errorMessage.value = "Couldn't check for updates. Try again later."
      errorDismissed.value = false
    }
    return 'network-error'
  } finally {
    checking.value = false
  }
}

async function startUpdate() {
  if (!pendingUpdate || downloading.value) return
  downloading.value = true
  downloadProgress.value = 0
  downloadTotal.value = 0
  errorMessage.value = ''

  try {
    await pendingUpdate.downloadAndInstall((event) => {
      switch (event.event) {
        case 'Started':
          downloadTotal.value = event.data.contentLength ?? 0
          break
        case 'Progress':
          downloadProgress.value += event.data.chunkLength
          break
        case 'Finished':
          break
      }
    })
    // On Windows, the NSIS installer runs in the background and waits for the app to close.
    // Relaunching immediately starts a new instance that locks the executable, causing the
    // update to fail. We must also kill the sidecar explicitly: process::exit skips Drop
    // impls, and an orphaned scanner_sidecar.exe keeps a file lock that blocks the installer.
    const isWindows = navigator.userAgent.includes('Windows') || navigator.userAgent.includes('Win')
    if (isWindows) {
      shutdownForUpdate()
    } else {
      await relaunch()
    }
  } catch (e) {
    console.error('Update install failed:', e)
    downloading.value = false
    errorMessage.value = "Couldn't install the update. Try again or download it manually."
    errorDismissed.value = false
  }
}

function dismiss() {
  dismissed.value = true
  // Re-check silently later instead of waiting for the next app launch
  if (dismissRetryTimer) clearTimeout(dismissRetryTimer)
  dismissRetryTimer = setTimeout(() => {
    void checkForUpdates(false)
  }, DISMISS_RETRY_MS)
}

function dismissError() {
  errorDismissed.value = true
  errorMessage.value = ''
}

export function useUpdater() {
  // Start automatic checks on first use (app lifetime — never stopped)
  if (!autoCheckTimer) {
    void checkForUpdates(false)
    autoCheckTimer = setInterval(() => void checkForUpdates(false), AUTO_CHECK_INTERVAL_MS)
  }

  return {
    updateAvailable,
    updateVersion,
    updateNotes,
    downloading,
    checking,
    downloadProgress,
    downloadTotal,
    dismissed,
    errorMessage,
    errorDismissed,
    checkForUpdates,
    startUpdate,
    dismiss,
    dismissError,
  }
}
