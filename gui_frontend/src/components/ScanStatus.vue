<template>
  <Card>
    <div class="flex items-center p-3">
      <span class="text-sm font-medium">{{ scanId }}</span>
      <Separator orientation="vertical" class="mx-3 h-4" />
      <span class="text-sm text-muted-foreground">{{ statusMessage }}</span>
    </div>
  </Card>
</template>

<script setup lang="ts">
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

defineProps<{
  scanId: string
  statusMessage: string
}>()
</script>
