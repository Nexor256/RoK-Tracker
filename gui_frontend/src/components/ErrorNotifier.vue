<template>
  <AlertDialog :open="errorStore.hasError">
    <AlertDialogContent class="sm:max-w-[500px]">
      <AlertDialogHeader>
        <AlertDialogTitle class="flex items-center gap-2 text-destructive">
          <AlertCircle class="h-5 w-5" />
          {{ errorStore.errorTitle }}
        </AlertDialogTitle>
        <AlertDialogDescription class="space-y-4">
          <!-- Suggestion Box -->
          <div class="rounded-md bg-muted p-3 text-sm text-foreground">
            <p class="font-medium mb-1">Suggestion</p>
            <p>{{ errorStore.errorSuggestion }}</p>
          </div>

          <!-- Raw Error Code -->
          <div>
            <p class="text-xs font-medium text-muted-foreground mb-1">Raw Error</p>
            <div class="rounded-md bg-destructive/10 p-3">
              <pre class="whitespace-pre-wrap break-words text-xs text-destructive">{{ errorStore.errorMessage }}</pre>
            </div>
          </div>
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogAction @click="handleAcknowledge" class="w-full sm:w-auto">
          Acknowledge
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>

<script setup lang="ts">
import { useErrorStore } from '@/stores/error-store'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
} from '@/components/ui/alert-dialog'
import { AlertCircle } from 'lucide-vue-next'

const errorStore = useErrorStore()

function handleAcknowledge() {
  errorStore.clearError()
}
</script>
