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

  // Stopping the sidecar kills the scanner backend, so if anything after that
  // point fails the app is no longer functional and a retry cannot work. Tell
  // the user to restart instead of offering one.
  let sidecarStopped = false

  try {
    // Download and install are split deliberately. On Windows the installer's
    // `CheckIfAppIsRunning` only shuts down the main binary, so a live
    // `scanner_sidecar.exe` keeps its own file locked and the installer stops
    // with "Error opening file for writing: scanner_sidecar.exe".
    //
    // `downloadAndInstall` cannot be used here: on Windows it ends in
    // `std::process::exit(0)` inside the plugin, so nothing sequenced after it
    // in JS ever runs and the sidecar could never be stopped in time. Killing
    // it between the download and the install puts the teardown ahead of the
    // installer deterministically.
    await pendingUpdate.download((event) => {
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

    // Waits for the sidecar process to be reaped, releasing its file lock.
    await shutdownForUpdate()
    sidecarStopped = true

    // Runs the installer detached, then exits this process on Windows.
    await pendingUpdate.install()

    // Only reached off Windows, where `install` returns normally.
    await relaunch()
  } catch (e) {
    console.error('Update install failed:', e)
    downloading.value = false
    errorDismissed.value = false
    if (sidecarStopped) {
      // The scanner backend is gone; only a restart brings it back.
      errorMessage.value =
        "Couldn't install the update, and the scanner backend was stopped to release its files. Please restart RoK Tracker Suite."
    } else {
      errorMessage.value = "Couldn't install the update. Try again or download it manually."
    }
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
