<template>
  <Card class="flex h-full flex-col">
    <CardHeader class="pb-2">
      <CardTitle>Screen {{ batchStatus.current_page }}</CardTitle>
      <CardDescription>of {{ batchStatus.target_governor / batchStatus.govs_per_page }}</CardDescription>
    </CardHeader>

    <Separator />

    <CardContent class="flex-1 overflow-auto py-3">
      <div class="space-y-1 text-sm">
        <div v-for="gov in batchData" :key="gov.img_path" class="flex justify-between">
          <span>{{ gov.name }}</span>
          <span class="text-muted-foreground">{{ formatNumber(gov.score) }}</span>
        </div>
      </div>
    </CardContent>

    <Separator />

    <CardFooter class="flex-col gap-2 py-3">
      <div class="flex w-full justify-between text-sm">
        <TooltipProvider>
          <div class="text-left">
            <div>Last Update</div>
            <Tooltip>
              <TooltipTrigger as-child>
                <span class="text-muted-foreground cursor-help">
                  <UseTimeAgo v-slot="{ timeAgo }" :time="lastUpdate">{{ timeAgo }}</UseTimeAgo>
                </span>
              </TooltipTrigger>
              <TooltipContent>{{ lastUpdateFormatted }}</TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
        <div class="text-center">
          <div>{{ batchStatus.current_page * batchStatus.govs_per_page }} of {{ batchStatus.target_governor }}</div>
        </div>
        <TooltipProvider>
          <div class="text-right">
            <div>Expected Finish</div>
            <Tooltip>
              <TooltipTrigger as-child>
                <span class="text-muted-foreground cursor-help">
                  <UseTimeAgo v-slot="{ timeAgo }" :time="expectedFinish" :show-second="true" :update-interval="1000">{{ timeAgo }}</UseTimeAgo>
                </span>
              </TooltipTrigger>
              <TooltipContent>{{ expectedFinishFormatted }}</TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </div>
      <Progress
        :model-value="((batchStatus.current_page * batchStatus.govs_per_page) / batchStatus.target_governor) * 100"
        class="w-full"
      />
    </CardFooter>
  </Card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { UseTimeAgo } from '@vueuse/components'
import { useDateFormat } from '@vueuse/core'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip'
import type { BatchAdditionalData } from '@/schema/BatchAdditionalData'
import type { BatchGovernorData } from '@/schema/BatchGovernorData'

const props = defineProps<{
  batchData: BatchGovernorData[]
  batchStatus: BatchAdditionalData
}>()

const lastUpdate = computed(() => new Date(props.batchStatus.current_time))
const expectedFinish = computed(
  () => new Date(lastUpdate.value.getTime() + props.batchStatus.remaining_sec * 1000),
)

const lastUpdateFormatted = useDateFormat(lastUpdate, 'HH:mm:ss')
const expectedFinishFormatted = useDateFormat(expectedFinish, 'HH:mm:ss')

const formatNumber = (value: number | string) => {
  return isNaN(Number(value)) ? (value as string) : Intl.NumberFormat().format(value as number)
}
</script>
