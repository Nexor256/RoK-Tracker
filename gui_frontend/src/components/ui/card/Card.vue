<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<{ class?: HTMLAttributes['class'] }>()
</script>

<template>
  <div :class="cn('rounded-xl border bg-card/60 backdrop-blur-md text-card-foreground shadow-sm', props.class)">
    <slot />
  </div>
</template>
