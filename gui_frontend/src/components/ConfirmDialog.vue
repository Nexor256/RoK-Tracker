<script setup lang="ts">
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

withDefaults(
  defineProps<{
    open: boolean
    title?: string
    message: string
    confirmText?: string
    cancelText?: string
    destructive?: boolean
  }>(),
  { title: 'Confirm', confirmText: 'Confirm', cancelText: 'Cancel', destructive: false },
)

const emit = defineEmits<{
  (e: 'confirm'): void
  (e: 'update:open', open: boolean): void
}>()
</script>

<template>
  <AlertDialog :open="open" @update:open="emit('update:open', $event)">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{{ title }}</AlertDialogTitle>
        <AlertDialogDescription>{{ message }}</AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel @click="emit('update:open', false)">{{ cancelText }}</AlertDialogCancel>
        <AlertDialogAction
          @click="emit('confirm')"
          :class="
            destructive ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''
          "
        >
          {{ confirmText }}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
