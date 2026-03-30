<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { check } from '@tauri-apps/plugin-updater'
import { relaunch } from '@tauri-apps/plugin-process'
import { Download, X, RefreshCw, ArrowUpCircle } from 'lucide-vue-next'

const updateAvailable = ref(false)
const updateVersion = ref('')
const updateNotes = ref('')
const downloading = ref(false)
const downloadProgress = ref(0)
const downloadTotal = ref(0)
const dismissed = ref(false)
const checkError = ref(false)

let pendingUpdate: Awaited<ReturnType<typeof check>> | null = null

async function checkForUpdates() {
  try {
    const update = await check()
    if (update) {
      pendingUpdate = update
      updateVersion.value = update.version
      updateNotes.value = update.body ?? ''
      updateAvailable.value = true
    }
  } catch (e) {
    console.warn('Update check failed:', e)
    checkError.value = true
  }
}

async function startUpdate() {
  if (!pendingUpdate) return
  downloading.value = true
  downloadProgress.value = 0
  downloadTotal.value = 0

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
    // On Windows the app exits automatically during install.
    // On other platforms relaunch:
    await relaunch()
  } catch (e) {
    console.error('Update install failed:', e)
    downloading.value = false
  }
}

function dismiss() {
  dismissed.value = true
}

const progressPercent = computed(() => {
  if (downloadTotal.value === 0) return 0
  return Math.round((downloadProgress.value / downloadTotal.value) * 100)
})

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

import { computed } from 'vue'

onMounted(() => {
  checkForUpdates()
})
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-all duration-400 ease-out"
      leave-active-class="transition-all duration-300 ease-in"
      enter-from-class="opacity-0 translate-y-4 scale-95"
      leave-to-class="opacity-0 translate-y-4 scale-95"
    >
      <div
        v-if="updateAvailable && !dismissed"
        class="fixed bottom-4 left-4 z-[100] w-[380px] pointer-events-auto"
      >
        <div
          class="relative overflow-hidden rounded-xl border border-primary/20 bg-background/95 backdrop-blur-md shadow-2xl shadow-primary/10"
        >
          <!-- Gradient accent bar -->
          <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary/80 to-emerald-500" />

          <div class="p-4 pt-5">
            <!-- Header -->
            <div class="flex items-start gap-3">
              <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <ArrowUpCircle class="h-5 w-5" />
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-semibold text-foreground">
                  Update Available
                </p>
                <p class="text-xs text-muted-foreground mt-0.5">
                  Version <span class="font-mono font-medium text-primary">{{ updateVersion }}</span> is ready
                </p>
              </div>
              <button
                v-if="!downloading"
                class="shrink-0 rounded-md p-1 text-muted-foreground/60 hover:text-foreground hover:bg-muted transition-all"
                @click="dismiss"
                aria-label="Dismiss update notification"
              >
                <X class="h-4 w-4" />
              </button>
            </div>

            <!-- Release notes (truncated) -->
            <p
              v-if="updateNotes && !downloading"
              class="mt-3 text-xs text-muted-foreground leading-relaxed line-clamp-2 pl-[52px]"
            >
              {{ updateNotes }}
            </p>

            <!-- Download progress -->
            <div v-if="downloading" class="mt-3 pl-[52px]">
              <div class="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                <span class="flex items-center gap-1.5">
                  <RefreshCw class="h-3 w-3 animate-spin" />
                  Downloading...
                </span>
                <span class="font-mono">{{ progressPercent }}%</span>
              </div>
              <div class="relative h-1.5 w-full overflow-hidden rounded-full bg-primary/10">
                <div
                  class="h-full rounded-full bg-gradient-to-r from-primary to-emerald-500 transition-all duration-300 ease-out"
                  :style="{ width: `${progressPercent}%` }"
                />
              </div>
              <p class="text-[10px] text-muted-foreground/70 mt-1 font-mono">
                {{ formatBytes(downloadProgress) }} / {{ formatBytes(downloadTotal) }}
              </p>
            </div>

            <!-- Action buttons -->
            <div v-if="!downloading" class="mt-3 flex gap-2 pl-[52px]">
              <button
                class="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
                @click="startUpdate"
              >
                <Download class="h-3.5 w-3.5" />
                Update Now
              </button>
              <button
                class="rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                @click="dismiss"
              >
                Later
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
