<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { ProgressIndicator, ProgressRoot, type ProgressRootProps } from 'radix-vue'
import { cn } from '@/lib/utils'

const props = withDefaults(defineProps<ProgressRootProps & { class?: HTMLAttributes['class'] }>(), {
  modelValue: 0,
})
</script>

<template>
  <ProgressRoot
    v-bind="props"
    :class="cn('relative h-2 w-full overflow-hidden rounded-full bg-primary/20', props.class)"
  >
    <ProgressIndicator
      class="h-full w-full flex-1 bg-primary transition-all"
      :style="`transform: translateX(-${100 - (props.modelValue ?? 0)}%)`"
    />
  </ProgressRoot>
</template>
